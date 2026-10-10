/**
 * MSW Socket.IO handler
 *
 * Intercepts the real `socket.io-client` WebSocket transport through MSW's
 * `ws.link()` and decodes the Socket.IO protocol with `@mswjs/socket.io-binding`.
 *
 * Limitations (see ARCHITECTURE.md):
 *  - only the default namespace "/" is supported by the binding;
 *  - only the WebSocket transport is intercepted (no HTTP long-polling);
 *  - rooms/broadcast are implemented here by hand on top of a connection registry;
 *  - the Engine.IO ping is emitted by this mock (the binding does not do it).
 */

import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import type { WSEvent, NFTUpdatedEvent, OrderUpdatedEvent } from '@/api/contracts';
import { store } from './data/store';

type SocketIoConnection = ReturnType<typeof toSocketIo>;

interface ClientState {
  io: SocketIoConnection;
  subscribedOrders: Set<string>;
  pingTimer: ReturnType<typeof setInterval>;
}

const clients = new Set<ClientState>();
let eventCounter = 0;
/** Monotonic per-resource version, so clients can ignore stale/duplicate events. */
const resourceVersions = new Map<string, number>();

function nextVersion(resourceKey: string): number {
  const version = (resourceVersions.get(resourceKey) ?? 0) + 1;
  resourceVersions.set(resourceKey, version);
  return version;
}

function buildEvent<T>(event: string, payload: T, version: number): WSEvent<T> {
  eventCounter += 1;
  return {
    event,
    payload,
    version,
    timestamp: new Date().toISOString(),
    idempotencyKey: `evt_${eventCounter}`,
  };
}

// ============================================
// Broadcasting
// ============================================

function emitNFTUpdated(nftId: string, changes: Omit<NFTUpdatedEvent, 'nftId' | 'version'>, version?: number) {
  const v = version ?? nextVersion(`nft:${nftId}`);
  const event = buildEvent<NFTUpdatedEvent>('nft.updated', { nftId, ...changes, version: v }, v);
  for (const client of clients) client.io.client.emit('nft.updated', event);
  return event;
}

function emitOrderUpdated(orderId: string, changes: Omit<OrderUpdatedEvent, 'orderId' | 'version'>, version?: number) {
  const v = version ?? nextVersion(`order:${orderId}`);
  const event = buildEvent<OrderUpdatedEvent>('order.updated', { orderId, ...changes, version: v }, v);
  for (const client of clients) {
    if (client.subscribedOrders.has(orderId)) client.io.client.emit('order.updated', event);
  }
  return event;
}

// ============================================
// Public controller (server-side triggers)
// ============================================

export const mockRealtime = {
  /** Change an NFT price in the store and broadcast it (REST and events stay consistent). */
  triggerNFTPriceChange(nftId: string, newPrice: string) {
    const nft = store.getNFTById(nftId);
    if (!nft) return null;
    const price = { ...nft.price, amount: newPrice, usdEquivalent: parseFloat(newPrice) * 2400 };
    store.updateNFT(nftId, { price });
    return emitNFTUpdated(nftId, { price });
  },

  triggerNFTStatusChange(nftId: string, status: 'available' | 'reserved' | 'sold' | 'hidden') {
    if (!store.getNFTById(nftId)) return null;
    store.updateNFT(nftId, { status });
    return emitNFTUpdated(nftId, { status });
  },

  triggerOrderStatusChange(orderId: string, status: OrderUpdatedEvent['status'], extra: Partial<OrderUpdatedEvent> = {}) {
    if (!store.getOrderById(orderId)) return null;
    const { transactionHash, blockNumber, failureReason } = extra;
    store.updateOrder(orderId, { status, transactionHash, blockNumber, failureReason });
    return emitOrderUpdated(orderId, { status, transactionHash, blockNumber, failureReason });
  },

  /** Re-send an already-emitted event (tests duplicate tolerance). */
  replay(event: WSEvent) {
    for (const client of clients) client.io.client.emit(event.event, event);
  },

  /** Force-close all sockets (tests reconnection). */
  disconnectAll() {
    for (const client of clients) {
      clearInterval(client.pingTimer);
      client.io.rawClient.close(1006, 'mock connection drop');
    }
    clients.clear();
  },

  connectionCount: () => clients.size,
};

// ============================================
// MSW ws handler
// ============================================

const realtimeLink = ws.link(/\/socket\.io\//);

export const socketHandlers = [
  realtimeLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection);
    const pingTimer = setInterval(() => {
      try {
        connection.client.send('2'); // Engine.IO ping, client answers with pong
      } catch {
        /* connection already closed */
      }
    }, 20_000);
    const client: ClientState = { io, subscribedOrders: new Set(), pingTimer };
    clients.add(client);

    connection.client.addEventListener('close', () => {
      clearInterval(pingTimer);
      clients.delete(client);
    });

    io.client.on('subscribe:order', (_e, orderId: string) => {
      client.subscribedOrders.add(orderId);
    });
    io.client.on('unsubscribe:order', (_e, orderId: string) => {
      client.subscribedOrders.delete(orderId);
    });

    // Reconciliation after reconnect: replay the current authoritative state.
    io.client.on('sync:nfts', (_e, data: { nftIds: string[] }) => {
      for (const nftId of data?.nftIds ?? []) {
        const nft = store.getNFTById(nftId);
        if (!nft) continue;
        const v = resourceVersions.get(`nft:${nftId}`) ?? 0;
        io.client.emit(
          'nft.updated',
          buildEvent<NFTUpdatedEvent>(
            'nft.updated',
            { nftId, price: nft.price, status: nft.status, edition: nft.edition, version: v },
            v,
          ),
        );
      }
    });

    io.client.on('sync:orders', (_e, data: { orderIds: string[] }) => {
      for (const orderId of data?.orderIds ?? []) {
        const order = store.getOrderById(orderId);
        if (!order) continue;
        client.subscribedOrders.add(orderId);
        const v = resourceVersions.get(`order:${orderId}`) ?? 0;
        io.client.emit(
          'order.updated',
          buildEvent<OrderUpdatedEvent>(
            'order.updated',
            {
              orderId,
              status: order.status,
              transactionHash: order.transactionHash,
              blockNumber: order.blockNumber,
              failureReason: order.failureReason,
              version: v,
            },
            v,
          ),
        );
      }
    });
  }),
];

export const socketTestUtils = mockRealtime;