/**
 * Socket.IO Hook
 * Manages real-time connection, event handling, and reconnection logic
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../api/axios';
import { getAccessToken } from '../api/axios';
import { queryClient, handleWebSocketEvent } from '../api/queryClient';
import type { WSEvent, NFTUpdatedEvent, OrderUpdatedEvent } from '../api/contracts';

// ============================================
// Event Types
// ============================================

type SocketEventHandler = (event: WSEvent) => void;

interface UseSocketOptions {
  autoConnect?: boolean;
  onNFTUpdated?: (event: NFTUpdatedEvent) => void;
  onOrderUpdated?: (event: OrderUpdatedEvent) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: unknown) => void;
  on: <T extends WSEvent>(event: string, handler: (event: T) => void) => () => void;
  off: (event: string, handler?: SocketEventHandler) => void;
}

// ============================================
// Hook
// ============================================

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const {
    autoConnect = true,
    onNFTUpdated,
    onOrderUpdated,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const handlersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectDelayRef = useRef(1000);

  // ============================================
  // Initialize Socket
  // ============================================

  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = getAccessToken();
    const wsUrl = getWebSocketUrl();

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: false,
    });

    // ============================================
    // Connection Events
    // ============================================

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 1000;
      onConnect?.();

      // Re-sync active resources after reconnection
      syncActiveResources(socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setConnectionError(error);
      onError?.(error);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptsRef.current = attemptNumber;
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after', maxReconnectAttempts, 'attempts');
      setConnectionError(new Error('Failed to reconnect after multiple attempts'));
    });

    // ============================================
    // Custom Events
    // ============================================

    socket.on('nft.updated', (event: WSEvent<NFTUpdatedEvent>) => {
      console.debug('[Socket] nft.updated:', event);
      handleWebSocketEvent(queryClient, event);
      onNFTUpdated?.(event.payload);
      emitToHandlers('nft.updated', event);
    });

    socket.on('order.updated', (event: WSEvent<OrderUpdatedEvent>) => {
      console.debug('[Socket] order.updated:', event);
      handleWebSocketEvent(queryClient, event);
      onOrderUpdated?.(event.payload);
      emitToHandlers('order.updated', event);
    });

    // Generic event handler for any other events
    socket.onAny((eventName, ...args) => {
      if (eventName === 'connect' || eventName === 'disconnect' || eventName === 'connect_error') return;
      const event: WSEvent = args[0];
      if (event && typeof event === 'object' && 'event' in event) {
        emitToHandlers(eventName, event);
      }
    });

    socketRef.current = socket;
  }, [onConnect, onDisconnect, onError, onNFTUpdated, onOrderUpdated]);

  // ============================================
  // Sync Active Resources After Reconnection
  // ============================================

  const syncActiveResources = async (socket: Socket) => {
    try {
      // Get currently viewed NFTs from query cache
      const nftQueries = queryClient.getQueryCache().findAll({ queryKey: ['nft'] });
      const nftIds = nftQueries.map((q) => q.queryKey[1]).filter(Boolean);

      // Get current order if any
      const orderQueries = queryClient.getQueryCache().findAll({ queryKey: ['order'] });
      const orderIds = orderQueries.map((q) => q.queryKey[1]).filter(Boolean);

      // Request sync for active resources
      if (nftIds.length > 0) {
        socket.emit('sync:nfts', { nftIds });
      }
      if (orderIds.length > 0) {
        socket.emit('sync:orders', { orderIds });
      }
    } catch (error) {
      console.error('[Socket] Failed to sync active resources:', error);
    }
  };

  // ============================================
  // Handler Management
  // ============================================

  const emitToHandlers = (eventName: string, event: WSEvent) => {
    const handlers = handlersRef.current.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[Socket] Handler error for ${eventName}:`, error);
        }
      });
    }
  };

  const on = useCallback(<T extends WSEvent>(eventName: string, handler: (event: T) => void) => {
    if (!handlersRef.current.has(eventName)) {
      handlersRef.current.set(eventName, new Set());
    }
    // Cast to SocketEventHandler since the handler signature is compatible
    handlersRef.current.get(eventName)!.add(handler as SocketEventHandler);

    // Return cleanup function
    return () => {
      const handlers = handlersRef.current.get(eventName);
      if (handlers) {
        handlers.delete(handler as SocketEventHandler);
        if (handlers.size === 0) {
          handlersRef.current.delete(eventName);
        }
      }
    };
  }, []);

  const off = useCallback((eventName: string, handler?: SocketEventHandler) => {
    if (handler) {
      const handlers = handlersRef.current.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(eventName);
        }
      }
    } else {
      handlersRef.current.delete(eventName);
    }
  }, []);

  // ============================================
  // Connection Control
  // ============================================

  const connect = useCallback(() => {
    if (!socketRef.current) {
      initializeSocket();
    }
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [initializeSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[Socket] Cannot emit - not connected');
    }
  }, []);

  // ============================================
  // Auto Connect
  // ============================================

  useEffect(() => {
    if (autoConnect) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect, initializeSocket]);

  // ============================================
  // Reconnect on Token Change
  // ============================================

  useEffect(() => {
    const token = getAccessToken();
    if (token && socketRef.current && !socketRef.current.connected) {
      socketRef.current.auth = { token };
      socketRef.current.connect();
    }
  }, [getAccessToken()]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for NFT real-time updates
 */
export const useNFTRealTime = (nftId: string | null, onUpdate?: (event: NFTUpdatedEvent) => void) => {
  const { on, off, isConnected } = useSocket({
    onNFTUpdated: onUpdate,
  });

  useEffect(() => {
    if (!nftId) return;

    const cleanup = on('nft.updated', (event: WSEvent<NFTUpdatedEvent>) => {
      if (event.payload.nftId === nftId) {
        onUpdate?.(event.payload);
      }
    });

    return cleanup;
  }, [nftId, on, off, onUpdate]);

  return { isConnected };
};

/**
 * Hook for Order real-time updates
 */
export const useOrderRealTime = (orderId: string | null, onUpdate?: (event: OrderUpdatedEvent) => void) => {
  const { on, off, isConnected } = useSocket({
    onOrderUpdated: onUpdate,
  });

  useEffect(() => {
    if (!orderId) return;

    const cleanup = on('order.updated', (event: WSEvent<OrderUpdatedEvent>) => {
      if (event.payload.orderId === orderId) {
        onUpdate?.(event.payload);
      }
    });

    return cleanup;
  }, [orderId, on, off, onUpdate]);

  return { isConnected };
};

/**
 * Hook for Cart real-time updates (price/availability changes)
 */
export const useCartRealTime = (onUpdate?: (event: NFTUpdatedEvent) => void) => {
  const { on, off, isConnected } = useSocket({
    onNFTUpdated: onUpdate,
  });

  useEffect(() => {
    const cleanup = on('nft.updated', (event: WSEvent<NFTUpdatedEvent>) => {
      onUpdate?.(event.payload);
    });

    return cleanup;
  }, [on, off, onUpdate]);

  return { isConnected };
};