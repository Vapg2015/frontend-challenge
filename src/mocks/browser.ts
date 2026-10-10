/**
 * MSW Browser Setup
 * Configures and starts the Mock Service Worker for browser environment
 */

import { setupWorker } from 'msw/browser';
import { allHandlers } from './handlers';
import { socketHandlers, mockRealtime } from './socket';

// ============================================
// Worker Setup
// ============================================

export const worker = setupWorker(...allHandlers, ...socketHandlers);

// ============================================
// Start Options
// ============================================

export const startMSW = async (options: {
  onUnhandledRequest?: 'bypass' | 'warn' | 'error';
  quiet?: boolean;
  serviceWorker?: { url: string };
} = {}) => {
  const {
    onUnhandledRequest = 'bypass',
    quiet = false,
    serviceWorker,
  } = options;

  // Mocks are enabled through VITE_MOCK_API=true (also in the demo/production build)
  const isMSWEnabled = import.meta.env.VITE_MOCK_API === 'true';

  if (!isMSWEnabled) {
    console.log('[MSW] Mock API disabled');
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest,
      quiet,
      serviceWorker: serviceWorker ?? { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    });

    console.log('[MSW] Mock Service Worker started');

    // Log available endpoints in development
    if (import.meta.env.DEV) {
      console.log('[MSW] Available endpoints:');
      console.log('  Auth:    POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/session, POST /auth/refresh, POST /auth/change-password');
      console.log('  NFTs:    GET /nfts, GET /nfts/:id, GET /collections, GET /collections/:id');
      console.log('  Favorites: GET /favorites, POST /favorites, DELETE /favorites/:nftId');
      console.log('  Cart:    GET /cart, POST /cart/items, PATCH /cart/items/:itemId, DELETE /cart/items/:itemId, POST /cart/coupon, DELETE /cart/coupon, DELETE /cart');
      console.log('  Quotes:  POST /quotes');
      console.log('  Orders:  POST /orders, GET /orders, GET /orders/:id');
      console.log('  Profile: GET /profile, PATCH /profile, POST /profile/avatar');
      console.log('  Wallets: GET /wallets, POST /wallets, PATCH /wallets/:id, DELETE /wallets/:id');
      console.log('  Networks: GET /networks, GET /networks/:id');
      console.log('  Admin:   POST /admin/reset, POST /admin/error-scenario, GET /admin/state');
    }

    // Expose worker for debugging
    if (typeof window !== 'undefined') {
      (window as any).__MSW_WORKER__ = worker;
    }
  } catch (error) {
    console.error('[MSW] Failed to start:', error);
  }
};

// ============================================
// Scenario Helpers
// ============================================

export const mswScenarios = {
  // Reset to default state
  reset: async (scenario: 'empty' | 'full' | 'checkout' | 'error' = 'full') => {
    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
  },

  // Enable error simulation
  enableErrors: async (errorRate = 0.1, statusCodes = [500, 502, 503], latency?: { min: number; max: number }) => {
    await fetch('/api/admin/error-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true, errorRate, statusCodes, latency }),
    });
  },

  // Disable error simulation
  disableErrors: async () => {
    await fetch('/api/admin/error-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
  },

  // Get current state
  getState: async () => {
    const response = await fetch('/api/admin/state');
    return response.json();
  },
};

// ============================================
// Debug / test helpers (mock side only; the UI never calls these)
// ============================================

if (typeof window !== 'undefined' && import.meta.env.VITE_MOCK_API === 'true') {
  (window as any).msw = {
    worker,
    scenarios: mswScenarios,
    realtime: mockRealtime,
  };
}

// ============================================
// Export for Testing
// ============================================

export { allHandlers } from './handlers';
export { store } from './data/store';