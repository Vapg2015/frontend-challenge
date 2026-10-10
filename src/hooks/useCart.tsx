/**
 * Cart Hook
 * Manages cart state with persistence, optimistic updates, and synchronization
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { queryKeys, optimisticHelpers } from '../api/queryClient';
import type { Cart, CartItem, AddToCartRequest, QuoteResponse, QuoteRequest } from '../api/contracts';
import { generateIdempotencyKey } from '../utils/idempotency';

// ============================================
// Types
// ============================================

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addItem: (nftId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  getQuote: (walletAddress?: string, network?: string) => Promise<QuoteResponse | null>;
  refreshCart: () => Promise<void>;
  clearError: () => void;

  // Computed
  itemCount: number;
  subtotal: string;
  total: string;
  discount: string;
  networkFee: string;
  isEmpty: boolean;
}

// ============================================
// Local Storage Keys
// ============================================

const CART_STORAGE_KEY = 'nft_marketplace_cart';
const CART_EXPIRY_KEY = 'nft_marketplace_cart_expiry';
const CART_EXPIRY_HOURS = 24;

// ============================================
// Local Storage Helpers
// ============================================

const saveCartToStorage = (cart: Cart) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(CART_EXPIRY_KEY, (Date.now() + CART_EXPIRY_HOURS * 60 * 60 * 1000).toString());
  } catch (error) {
    console.error('Failed to save cart to storage:', error);
  }
};

const loadCartFromStorage = (): Cart | null => {
  if (typeof window === 'undefined') return null;
  try {
    const expiry = localStorage.getItem(CART_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_EXPIRY_KEY);
      return null;
    }

    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load cart from storage:', error);
    return null;
  }
};

const clearCartStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(CART_EXPIRY_KEY);
};

// ============================================
// Context Creation
// ============================================

const CartContext = createContext<CartContextType | null>(null);

// ============================================
// Provider Component
// ============================================

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const queryClient = useQueryClient();
  const [localCart, setLocalCart] = useState<Cart | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ============================================
  // Hydrate from localStorage on mount
  // ============================================

  useEffect(() => {
    const stored = loadCartFromStorage();
    if (stored) {
      setLocalCart(stored);
    }
    setHydrated(true);
  }, []);

  // ============================================
  // Server Cart Query (when authenticated)
  // ============================================

  const { data: serverCart, isLoading: isServerCartLoading, refetch: refetchServerCart } = useQuery({
    queryKey: queryKeys.cart(),
    queryFn: async () => {
      const res = await api.get<Cart>('/cart');
      return res.data;
    },
    enabled: false, // Only enable when authenticated
    staleTime: 10_000,
  });

  // ============================================
  // Mutations
  // ============================================

  const addItemMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => api.post<Cart>('/cart/items', data),
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart() });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart());

      // Optimistic update
      optimisticHelpers.updateCart(queryClient, (old: Cart | undefined) => {
        if (!old) return old;
        // Check if item already exists
        const existingItemIndex = old.items.findIndex((item) => item.nftId === newItem.nftId);
        let newItems: CartItem[];

        if (existingItemIndex >= 0) {
          newItems = [...old.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + newItem.quantity,
          };
        } else {
          // This would need the NFT data - in reality we'd fetch it
          // For now, we'll let the server handle it
          return old;
        }

        return {
          ...old,
          items: newItems,
          itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousCart };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart(), context.previousCart);
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart(), response.data);
      saveCartToStorage(response.data);
      setLocalCart(response.data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart() });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch<Cart>(`/cart/items/${itemId}`, { quantity }),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart() });
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart());

      optimisticHelpers.updateCart(queryClient, (old: Cart | undefined) => {
        if (!old) return old;
        const newItems = old.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ).filter((item) => item.quantity > 0);

        return {
          ...old,
          items: newItems,
          itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart(), context.previousCart);
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart(), response.data);
      saveCartToStorage(response.data);
      setLocalCart(response.data);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete<Cart>(`/cart/items/${itemId}`),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart() });
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart());

      optimisticHelpers.updateCart(queryClient, (old: Cart | undefined) => {
        if (!old) return old;
        const newItems = old.items.filter((item) => item.id !== itemId);
        return {
          ...old,
          items: newItems,
          itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousCart };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart(), context.previousCart);
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart(), response.data);
      saveCartToStorage(response.data);
      setLocalCart(response.data);
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => api.post<Cart>('/cart/coupon', { code }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart(), response.data);
      saveCartToStorage(response.data);
      setLocalCart(response.data);
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: () => api.delete<Cart>('/cart/coupon'),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart(), response.data);
      saveCartToStorage(response.data);
      setLocalCart(response.data);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => api.delete<Cart>('/cart'),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.cart(), null);
      clearCartStorage();
      setLocalCart(null);
    },
  });

  // ============================================
  // Merge Local and Server Cart
  // ============================================

  const cart = serverCart || localCart;

  // ============================================
  // Actions
  // ============================================

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await removeItemMutation.mutateAsync(itemId);
    } catch (error) {
      throw error;
    }
  }, [removeItemMutation]);

  const addItem = useCallback(async (nftId: string, quantity: number) => {
    try {
      await addItemMutation.mutateAsync({ nftId, quantity });
    } catch (error) {
      throw error;
    }
  }, [addItemMutation]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    try {
      await updateQuantityMutation.mutateAsync({ itemId, quantity });
    } catch (error) {
      throw error;
    }
  }, [updateQuantityMutation, removeItem]);

  const applyCoupon = useCallback(async (code: string) => {
    try {
      await applyCouponMutation.mutateAsync(code);
    } catch (error) {
      throw error;
    }
  }, [applyCouponMutation]);

  const removeCoupon = useCallback(async () => {
    try {
      await removeCouponMutation.mutateAsync();
    } catch (error) {
      throw error;
    }
  }, [removeCouponMutation]);

  const clearCart = useCallback(async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      throw error;
    }
  }, [clearCartMutation]);

  const getQuote = useCallback(async (walletAddress?: string, network?: string): Promise<QuoteResponse | null> => {
    if (!cart || cart.items.length === 0) return null;

    try {
      const quoteRequest: QuoteRequest = {
        items: cart.items.map((item) => ({
          nftId: item.nftId,
          quantity: item.quantity,
        })),
        walletAddress,
        network,
        couponCode: cart.coupon?.code,
      };

      const response = await api.post<QuoteResponse>('/quotes', quoteRequest);
      return response.data;
    } catch (error) {
      console.error('Failed to get quote:', error);
      return null;
    }
  }, [cart]);

  const refreshCart = useCallback(async () => {
    await refetchServerCart();
  }, [refetchServerCart]);

  const clearError = useCallback(() => {
    // Clear any error state if needed
  }, []);

  // ============================================
  // Computed Values
  // ============================================

  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.subtotal || '0';
  const total = cart?.total || '0';
  const discount = cart?.discount || '0';
  const networkFee = cart?.networkFee || '0';
  const isEmpty = !cart || cart.items.length === 0;

  // ============================================
  // Render
  // ============================================

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading: !hydrated || isServerCartLoading,
        error: null,
        addItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        getQuote,
        refreshCart,
        clearError,
        itemCount,
        subtotal,
        total,
        discount,
        networkFee,
        isEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// ============================================
// Cart Sync Helpers
// ============================================

/**
 * Sync local cart to server after login
 */
export const syncCartToServer = async (cart: Cart): Promise<Cart | null> => {
  if (cart.items.length === 0) return null;

  try {
    // Add all items to server cart
    for (const item of cart.items) {
      await api.post('/cart/items', {
        nftId: item.nftId,
        quantity: item.quantity,
      });
    }

    // Get updated server cart
    const response = await api.get<Cart>('/cart');
    saveCartToStorage(response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to sync cart to server:', error);
    return null;
  }
};

/**
 * Initialize cart for new session (guest or user)
 */
export const initializeCart = async (): Promise<Cart> => {
  try {
    const response = await api.get<Cart>('/cart');
    saveCartToStorage(response.data);
    return response.data;
  } catch {
    // Return empty cart structure
    const emptyCart: Cart = {
      id: generateIdempotencyKey(),
      items: [],
      subtotal: '0',
      itemCount: 0,
      discount: '0',
      networkFee: '0',
      total: '0',
      updatedAt: new Date().toISOString(),
    };
    saveCartToStorage(emptyCart);
    return emptyCart;
  }
};