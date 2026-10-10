/**
 * MSW Data Store
 * In-memory state with localStorage persistence for mock API
 */

import type { NFT, User, Wallet, Cart, CartItem, Order, Favorite, AppliedCoupon } from '@/api/contracts';
import {
  mockUsers,
  mockNFTs,
  mockCollections,
  mockWallets,
  mockCarts,
  mockCoupons,
  mockOrders,
  mockFavorites,
  supportedNetworks,
} from './fixtures';

// ============================================
// State Management
// ============================================

interface StoreState {
  users: User[];
  nfts: NFT[];
  collections: typeof mockCollections;
  wallets: Wallet[];
  carts: Record<string, Cart>;
  coupons: Record<string, AppliedCoupon>;
  orders: Order[];
  favorites: Favorite[];
  sessions: Record<string, { userId: string; expiresAt: string }>;
  nonce: Record<string, string>;
}

// Initialize from localStorage or defaults
const STORAGE_KEY = 'nft_marketplace_mock_store';
const STORAGE_VERSION = 1;

function getInitialState(): StoreState {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === STORAGE_VERSION) {
        return parsed.state;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return createDefaultState();
}

function createDefaultState(): StoreState {
  return {
    users: [...mockUsers],
    nfts: [...mockNFTs],
    collections: [...mockCollections],
    wallets: [...mockWallets],
    carts: { ...mockCarts },
    coupons: { ...mockCoupons },
    orders: [...mockOrders],
    favorites: [...mockFavorites],
    sessions: {},
    nonce: {},
  };
}

let state = getInitialState();

// ============================================
// Persistence
// ============================================

function persistState() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      state,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to persist mock store:', error);
  }
}

// ============================================
// Reset Functions
// ============================================

export function resetStore() {
  state = createDefaultState();
  persistState();
}

export function resetStoreToScenario(scenario: 'empty' | 'full' | 'checkout' | 'error') {
  switch (scenario) {
    case 'empty':
      state = {
        ...createDefaultState(),
        nfts: [],
        users: [],
        carts: { guest: createEmptyCart('guest') },
      };
      break;
    case 'full':
      state = createDefaultState();
      break;
    case 'checkout':
      state = createDefaultState();
      state.carts.user_1 = {
        ...state.carts.user_1,
        items: state.nfts.slice(0, 3).map((nft, i) => createCartItem(nft, i + 1)),
      };
      recalculateCart(state.carts.user_1);
      break;
    case 'error':
      state = createDefaultState();
      break;
  }
  persistState();
}

// ============================================
// Helper Functions
// ============================================

function createEmptyCart(sessionId: string): Cart {
  return {
    id: `cart_${sessionId}`,
    sessionId,
    items: [],
    subtotal: '0',
    itemCount: 0,
    discount: '0',
    networkFee: '0.002',
    total: '0.002',
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function createCartItem(nft: NFT, quantity: number): CartItem {
  return {
    id: `cart_item_${nft.id}_${Date.now()}`,
    nftId: nft.id,
    nft,
    quantity,
    unitPrice: nft.price.amount,
    totalPrice: (parseFloat(nft.price.amount) * quantity).toFixed(4),
    addedAt: new Date().toISOString(),
  };
}

function recalculateCart(cart: Cart) {
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(4);

  let discount = '0';
  if (cart.coupon) {
    const coupon = state.coupons[cart.coupon.code];
    if (coupon) {
      const sub = parseFloat(cart.subtotal);
      if (coupon.type === 'percentage') {
        discount = (sub * (parseFloat(coupon.value) / 100)).toFixed(4);
      } else {
        discount = Math.min(parseFloat(coupon.value), sub).toFixed(4);
      }
    }
  }
  cart.discount = discount;

  const networkFee = 0.002;
  cart.total = (parseFloat(cart.subtotal) - parseFloat(discount) + networkFee).toFixed(4);
  cart.updatedAt = new Date().toISOString();
}

function getCartKey(userId?: string, sessionId?: string): string {
  return userId || `guest_${sessionId || 'default'}`;
}

function getOrCreateCart(userId?: string, sessionId?: string): Cart {
  const key = getCartKey(userId, sessionId);
  if (!state.carts[key]) {
    state.carts[key] = createEmptyCart(sessionId || 'default');
    if (userId) {
      state.carts[key].userId = userId;
    }
    persistState();
  }
  return state.carts[key];
}

// ============================================
// Delay Helper
// ============================================

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(min = 100, max = 500): Promise<void> {
  return delay(Math.random() * (max - min) + min);
}

// ============================================
// Error Simulation
// ============================================

export interface ErrorScenario {
  enabled: boolean;
  errorRate: number; // 0-1
  statusCodes: number[];
  latency?: { min: number; max: number };
}

let errorScenario: ErrorScenario = {
  enabled: false,
  errorRate: 0,
  statusCodes: [500, 502, 503, 504],
};

export function setErrorScenario(scenario: Partial<ErrorScenario>) {
  errorScenario = { ...errorScenario, ...scenario };
}

export function shouldSimulateError(): { shouldError: boolean; statusCode?: number; delay?: number } {
  if (!errorScenario.enabled || Math.random() > errorScenario.errorRate) {
    return { shouldError: false };
  }

  const statusCode = errorScenario.statusCodes[Math.floor(Math.random() * errorScenario.statusCodes.length)];
  const delayMs = errorScenario.latency
    ? Math.random() * (errorScenario.latency.max - errorScenario.latency.min) + errorScenario.latency.min
    : 0;

  return { shouldError: true, statusCode, delay: delayMs };
}

// ============================================
// State Accessors
// ============================================

export const store = {
  // Users
  getUsers: () => state.users,
  getUserById: (id: string) => state.users.find((u) => u.id === id),
  getUserByEmail: (email: string) => state.users.find((u) => u.email === email),
  createUser: (user: User) => {
    state.users.push(user);
    persistState();
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const index = state.users.findIndex((u) => u.id === id);
    if (index >= 0) {
      state.users[index] = { ...state.users[index], ...updates, updatedAt: new Date().toISOString() };
      persistState();
      return state.users[index];
    }
    return null;
  },

  // NFTs
  getNFTs: () => state.nfts,
  getNFTById: (id: string) => state.nfts.find((n) => n.id === id),
  updateNFT: (id: string, updates: Partial<NFT>) => {
    const index = state.nfts.findIndex((n) => n.id === id);
    if (index >= 0) {
      state.nfts[index] = { ...state.nfts[index], ...updates, updatedAt: new Date().toISOString() };
      persistState();
      return state.nfts[index];
    }
    return null;
  },

  // Collections
  getCollections: () => state.collections,
  getCollectionById: (id: string) => state.collections.find((c) => c.id === id),
  getCollectionBySlug: (slug: string) => state.collections.find((c) => c.slug === slug),

  // Wallets
  getWallets: (userId: string) => state.wallets.filter((w) => w.userId === userId),
  getWalletById: (id: string) => state.wallets.find((w) => w.id === id),
  createWallet: (wallet: Wallet) => {
    state.wallets.push(wallet);
    persistState();
    return wallet;
  },
  updateWallet: (id: string, updates: Partial<Wallet>) => {
    const index = state.wallets.findIndex((w) => w.id === id);
    if (index >= 0) {
      state.wallets[index] = { ...state.wallets[index], ...updates, updatedAt: new Date().toISOString() };
      persistState();
      return state.wallets[index];
    }
    return null;
  },
  deleteWallet: (id: string) => {
    state.wallets = state.wallets.filter((w) => w.id !== id);
    persistState();
  },

  // Carts
  getCart: (userId?: string, sessionId?: string) => getOrCreateCart(userId, sessionId),
  updateCart: (userId: string | undefined, sessionId: string | undefined, updates: Partial<Cart>) => {
    const key = getCartKey(userId, sessionId);
    if (state.carts[key]) {
      state.carts[key] = { ...state.carts[key], ...updates };
      recalculateCart(state.carts[key]);
      persistState();
      return state.carts[key];
    }
    return null;
  },
  addCartItem: (userId: string | undefined, sessionId: string | undefined, item: CartItem) => {
    const cart = getOrCreateCart(userId, sessionId);
    const existingIndex = cart.items.findIndex((i) => i.nftId === item.nftId);
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity;
      cart.items[existingIndex].totalPrice = (parseFloat(cart.items[existingIndex].unitPrice) * cart.items[existingIndex].quantity).toFixed(4);
    } else {
      cart.items.push(item);
    }
    recalculateCart(cart);
    persistState();
    return cart;
  },
  updateCartItemQuantity: (userId: string | undefined, sessionId: string | undefined, itemId: string, quantity: number) => {
    const cart = getOrCreateCart(userId, sessionId);
    const index = cart.items.findIndex((i) => i.id === itemId);
    if (index >= 0) {
      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
        cart.items[index].totalPrice = (parseFloat(cart.items[index].unitPrice) * quantity).toFixed(4);
      }
      recalculateCart(cart);
      persistState();
      return cart;
    }
    return null;
  },
  removeCartItem: (userId: string | undefined, sessionId: string | undefined, itemId: string) => {
    const cart = getOrCreateCart(userId, sessionId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    recalculateCart(cart);
    persistState();
    return cart;
  },
  applyCouponToCart: (userId: string | undefined, sessionId: string | undefined, code: string) => {
    const cart = getOrCreateCart(userId, sessionId);
    const coupon = state.coupons[code.toUpperCase()];
    if (coupon && new Date(coupon.validUntil) > new Date()) {
      cart.coupon = coupon;
      recalculateCart(cart);
      persistState();
      return { success: true, cart };
    }
    return { success: false, error: 'Invalid or expired coupon' };
  },
  removeCouponFromCart: (userId: string | undefined, sessionId: string | undefined) => {
    const cart = getOrCreateCart(userId, sessionId);
    delete cart.coupon;
    recalculateCart(cart);
    persistState();
    return cart;
  },
  mergeCarts: (sourceUserId: string, targetUserId: string) => {
    const sourceCart = state.carts[sourceUserId];
    const targetCart = getOrCreateCart(targetUserId);

    if (sourceCart && sourceCart.items.length > 0) {
      for (const item of sourceCart.items) {
        const existingIndex = targetCart.items.findIndex((i) => i.nftId === item.nftId);
        if (existingIndex >= 0) {
          targetCart.items[existingIndex].quantity += item.quantity;
          targetCart.items[existingIndex].totalPrice = (parseFloat(targetCart.items[existingIndex].unitPrice) * targetCart.items[existingIndex].quantity).toFixed(4);
        } else {
          targetCart.items.push(item);
        }
      }
      recalculateCart(targetCart);
      delete state.carts[sourceUserId];
      persistState();
    }
    return targetCart;
  },

  // Coupons
  getCoupon: (code: string) => state.coupons[code.toUpperCase()],
  validateCoupon: (code: string, subtotal: string) => {
    const coupon = state.coupons[code.toUpperCase()];
    if (!coupon) return { valid: false, error: 'Coupon not found' };
    if (new Date(coupon.validUntil) < new Date()) return { valid: false, error: 'Coupon expired' };

    const sub = parseFloat(subtotal);
    let discount = '0';
    if (coupon.type === 'percentage') {
      discount = (sub * (parseFloat(coupon.value) / 100)).toFixed(4);
    } else {
      discount = Math.min(parseFloat(coupon.value), sub).toFixed(4);
    }

    return { valid: true, coupon: { ...coupon, discount } };
  },

  // Orders
  getOrders: (userId?: string) => userId ? state.orders.filter((o) => o.userId === userId) : state.orders,
  getOrderById: (id: string) => state.orders.find((o) => o.id === id),
  getOrderByIdempotencyKey: (key: string) => state.orders.find((o) => o.idempotencyKey === key),
  createOrder: (order: Order) => {
    state.orders.push(order);
    persistState();
    return order;
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    const index = state.orders.findIndex((o) => o.id === id);
    if (index >= 0) {
      state.orders[index] = { ...state.orders[index], ...updates, updatedAt: new Date().toISOString() };
      persistState();
      return state.orders[index];
    }
    return null;
  },

  // Favorites
  getFavorites: (userId: string) => state.favorites.filter((f) => f.userId === userId),
  getFavorite: (userId: string, nftId: string) => state.favorites.find((f) => f.userId === userId && f.nftId === nftId),
  addFavorite: (favorite: Favorite) => {
    state.favorites.push(favorite);
    persistState();
    return favorite;
  },
  removeFavorite: (userId: string, nftId: string) => {
    state.favorites = state.favorites.filter((f) => !(f.userId === userId && f.nftId === nftId));
    persistState();
  },

  // Sessions
  createSession: (userId: string, _accessToken: string, _refreshToken: string) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    state.sessions[sessionId] = {
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    persistState();
    return sessionId;
  },
  getSession: (sessionId: string) => state.sessions[sessionId],
  deleteSession: (sessionId: string) => {
    delete state.sessions[sessionId];
    persistState();
  },

  // Nonce (for wallet auth simulation)
  setNonce: (address: string, nonce: string) => {
    state.nonce[address.toLowerCase()] = nonce;
    persistState();
  },
  getNonce: (address: string) => state.nonce[address.toLowerCase()],
  verifyNonce: (address: string, nonce: string) => state.nonce[address.toLowerCase()] === nonce,

  // Networks
  getNetworks: () => supportedNetworks,
  getNetwork: (id: string) => supportedNetworks.find((n) => n.id === id),

  // Utility
  getState: () => state,
  persist: persistState,
};