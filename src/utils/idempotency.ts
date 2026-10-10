/**
 * Idempotency Key Management
 * Handles generation, storage, and retrieval of idempotency keys for order creation
 */

// ============================================
// Storage Keys
// ============================================

const IDEMPOTENCY_KEY_PREFIX = 'nft_marketplace_idem_';
const MAX_STORED_KEYS = 10;

// ============================================
// Key Generation
// ============================================

/**
 * Generate a new idempotency key
 * Format: idem_{timestamp}_{random}
 */
export const generateIdempotencyKey = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${IDEMPOTENCY_KEY_PREFIX}${timestamp}_${random}_${random2}`;
};

/**
 * Generate a deterministic idempotency key from order data
 * Used for recovery scenarios
 */
export const generateDeterministicIdempotencyKey = (data: {
  userId: string;
  items: Array<{ nftId: string; quantity: number }>;
  walletAddress: string;
}): string => {
  const payload = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${IDEMPOTENCY_KEY_PREFIX}det_${Math.abs(hash).toString(36)}_${Date.now()}`;
};

// ============================================
// Storage Management
// ============================================

/**
 * Store an idempotency key with associated order data
 */
export const storeIdempotencyKey = (
  key: string,
  orderData: {
    quoteId: string;
    items: Array<{ nftId: string; quantity: number }>;
    walletAddress: string;
    network: string;
    collectorInfo: { email: string; name: string; address?: string };
    createdAt?: string;
  }
): void => {
  if (typeof window === 'undefined') return;

  try {
    // Get existing keys
    const stored = sessionStorage.getItem('idempotency_keys');
    const keys: Record<string, any> = stored ? JSON.parse(stored) : {};

    // Add new key
    keys[key] = {
      ...orderData,
      key,
      createdAt: new Date().toISOString(),
    };

    // Limit stored keys
    const keyList = Object.keys(keys);
    if (keyList.length > MAX_STORED_KEYS) {
      // Remove oldest keys
      keyList
        .sort((a, b) => new Date(keys[a].createdAt).getTime() - new Date(keys[b].createdAt).getTime())
        .slice(0, keyList.length - MAX_STORED_KEYS)
        .forEach((oldKey) => delete keys[oldKey]);
    }

    sessionStorage.setItem('idempotency_keys', JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to store idempotency key:', error);
  }
};

/**
 * Retrieve order data for an idempotency key
 */
export const getIdempotencyKeyData = (key: string): {
  quoteId: string;
  items: Array<{ nftId: string; quantity: number }>;
  walletAddress: string;
  network: string;
  collectorInfo: { email: string; name: string; address?: string };
  createdAt: string;
} | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return null;

    const keys: Record<string, any> = JSON.parse(stored);
    return keys[key] || null;
  } catch (error) {
    console.error('Failed to retrieve idempotency key data:', error);
    return null;
  }
};

/**
 * Get the most recent idempotency key
 */
export const getLatestIdempotencyKey = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return null;

    const keys: Record<string, any> = JSON.parse(stored);
    const keyList = Object.keys(keys);

    if (keyList.length === 0) return null;

    // Return the most recent key
    return keyList.reduce((latest, current) =>
      new Date(keys[current].createdAt) > new Date(keys[latest].createdAt) ? current : latest
    );
  } catch (error) {
    console.error('Failed to get latest idempotency key:', error);
    return null;
  }
};

/**
 * Clear all stored idempotency keys (on logout)
 */
export const clearIdempotencyKeys = (): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('idempotency_keys');
  } catch (error) {
    console.error('Failed to clear idempotency keys:', error);
  }
};

/**
 * Check if an idempotency key exists
 */
export const hasIdempotencyKey = (key: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return false;

    const keys: Record<string, any> = JSON.parse(stored);
    return !!keys[key];
  } catch {
    return false;
  }
};

// ============================================
// Recovery Helpers
// ============================================

/**
 * Check for pending order that needs recovery
 * Returns the order data if there's a pending order that can be recovered
 */
export const checkForPendingOrderRecovery = (): {
  key: string;
  orderData: any;
} | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return null;

    const keys: Record<string, any> = JSON.parse(stored);
    const keyList = Object.keys(keys);

    // Look for keys created in the last 30 minutes
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    for (const key of keyList) {
      const keyData = keys[key];
      const createdAt = new Date(keyData.createdAt).getTime();

      if (createdAt > thirtyMinutesAgo) {
        // This key might have a pending order
        return { key, orderData: keyData };
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to check for pending order recovery:', error);
    return null;
  }
};

/**
 * Mark an idempotency key as completed (order confirmed/rejected)
 */
export const markIdempotencyKeyCompleted = (key: string, orderId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return;

    const keys: Record<string, any> = JSON.parse(stored);
    if (keys[key]) {
      keys[key].completed = true;
      keys[key].orderId = orderId;
      keys[key].completedAt = new Date().toISOString();
      sessionStorage.setItem('idempotency_keys', JSON.stringify(keys));
    }
  } catch (error) {
    console.error('Failed to mark idempotency key as completed:', error);
  }
};

/**
 * Clean up completed idempotency keys older than 1 hour
 */
export const cleanupOldIdempotencyKeys = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const stored = sessionStorage.getItem('idempotency_keys');
    if (!stored) return;

    const keys: Record<string, any> = JSON.parse(stored);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    let hasChanges = false;
    for (const key of Object.keys(keys)) {
      const keyData = keys[key];
      const createdAt = new Date(keyData.createdAt).getTime();

      // Remove completed keys older than 1 hour
      if (keyData.completed && createdAt < oneHourAgo) {
        delete keys[key];
        hasChanges = true;
      }
      // Remove incomplete keys older than 30 minutes (likely abandoned)
      else if (!keyData.completed && createdAt < oneHourAgo) {
        delete keys[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      sessionStorage.setItem('idempotency_keys', JSON.stringify(keys));
    }
  } catch (error) {
    console.error('Failed to cleanup old idempotency keys:', error);
  }
};

// ============================================
// React Hook (for use in components)
// ============================================

import { useCallback } from 'react';

export const useIdempotency = () => {
  const createKey = useCallback(() => generateIdempotencyKey(), []);
  const storeKey = useCallback((key: string, data: any) => storeIdempotencyKey(key, data), []);
  const getKeyData = useCallback((key: string) => getIdempotencyKeyData(key), []);
  const getLatestKey = useCallback(() => getLatestIdempotencyKey(), []);
  const clearKeys = useCallback(() => clearIdempotencyKeys(), []);
  const checkRecovery = useCallback(() => checkForPendingOrderRecovery(), []);
  const markCompleted = useCallback((key: string, orderId: string) => markIdempotencyKeyCompleted(key, orderId), []);
  const cleanup = useCallback(() => cleanupOldIdempotencyKeys(), []);

  return {
    createKey,
    storeKey,
    getKeyData,
    getLatestKey,
    clearKeys,
    checkRecovery,
    markCompleted,
    cleanup,
  };
};