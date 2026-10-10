/**
 * TanStack Query Configuration
 * Centralized query client with default options, cache policies, and retry strategies
 */

import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

// ============================================
// Query Keys Factory
// ============================================

export const queryKeys = {
  // Auth
  session: () => ['session'] as const,
  user: (userId: string) => ['user', userId] as const,

  // NFTs
  nfts: (params?: Record<string, unknown>) => ['nfts', params] as const,
  nft: (id: string) => ['nft', id] as const,
  collections: () => ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,

  // Favorites
  favorites: (userId?: string) => ['favorites', userId] as const,
  favorite: (nftId: string) => ['favorite', nftId] as const,

  // Cart
  cart: (userId?: string) => ['cart', userId] as const,

  // Quote
  quote: (params: Record<string, unknown>) => ['quote', params] as const,

  // Orders
  orders: (userId?: string) => ['orders', userId] as const,
  order: (id: string) => ['order', id] as const,

  // Wallets
  wallets: (userId: string) => ['wallets', userId] as const,
  wallet: (id: string) => ['wallet', id] as const,
} as const;

// ============================================
// Default Query Options
// ============================================

const defaultQueryOptions = {
  // Stale time: 30 seconds for most queries
  staleTime: 30_000,
  // Cache time: 5 minutes
  gcTime: 5 * 60 * 1000,
  // Retry failed queries 3 times with exponential backoff
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  // Refetch on window focus for fresh data
  refetchOnWindowFocus: true,
  // Refetch on reconnect
  refetchOnReconnect: true,
  // Don't refetch on mount if data is fresh
  refetchOnMount: false,
  // Throw errors for error boundaries
  throwOnError: false,
} as const;

// ============================================
// Default Mutation Options
// ============================================

const defaultMutationOptions = {
  // Retry mutations once on network errors
  retry: (failureCount: number, error: unknown) => {
    if (failureCount >= 1) return false;
    // Only retry on network errors, not on 4xx/5xx responses
    if (error instanceof Response || (error as { status?: number }).status) {
      const status = (error as { status: number }).status;
      return status >= 500 || status === 0;
    }
    return true;
  },
  retryDelay: 1000,
  // Don't throw, let components handle errors
  throwOnError: false,
} as const;

// ============================================
// Query Client Creation
// ============================================

export const createQueryClient = (config?: Partial<QueryClientConfig>): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: defaultMutationOptions,
    },
    ...config,
  });
};

// ============================================
// Singleton Instance (for non-React contexts)
// ============================================

let queryClientInstance: QueryClient | null = null;

export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
};

// Export singleton instance for direct access
export const queryClient = getQueryClient();

// ============================================
// Invalidation Helpers
// ============================================

export const invalidationHelpers = {
  // Invalidate all NFT-related queries
  nfts: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['nfts'] });
  },

  // Invalidate specific NFT
  nft: (queryClient: QueryClient, nftId: string) => {
    queryClient.invalidateQueries({ queryKey: ['nft', nftId] });
    queryClient.invalidateQueries({ queryKey: ['nfts'] });
  },

  // Invalidate cart
  cart: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  },

  // Invalidate favorites
  favorites: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
  },

  // Invalidate orders
  orders: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['orders', userId] });
  },

  // Invalidate user data
  user: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },

  // Invalidate wallets
  wallets: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
  },

  // Invalidate everything for a user (on login/logout)
  userSession: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['session'] });
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
    queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    queryClient.invalidateQueries({ queryKey: ['orders', userId] });
    queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
  },

  // Clear all queries (on logout)
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

// ============================================
// Prefetching Helpers
// ============================================

export const prefetchHelpers = {
  // Prefetch NFT detail
  nft: async (queryClient: QueryClient, nftId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['nft', nftId],
      staleTime: 60_000,
    });
  },

  // Prefetch NFTs list
  nfts: async (queryClient: QueryClient, params?: Record<string, unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: ['nfts', params],
      staleTime: 30_000,
    });
  },

  // Prefetch user profile
  user: async (queryClient: QueryClient, userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['user', userId],
      staleTime: 60_000,
    });
  },
};

// ============================================
// Optimistic Update Helpers
// ============================================

export const optimisticHelpers = {
  // Update NFT in cache optimistically
  updateNFT: (
    queryClient: QueryClient,
    nftId: string,
    updates: Partial<{ price: { amount: string }; status: string; edition: { available: number }; version: number }>
  ) => {
    queryClient.setQueryData(['nft', nftId], (old: any) => {
      if (!old) return old;
      return { ...old, ...updates };
    });

    // Also update in lists
    queryClient.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((nft: any) =>
          nft.id === nftId ? { ...nft, ...updates } : nft
        ),
      };
    });
  },

  // Update cart optimistically
  updateCart: (queryClient: QueryClient, updater: (old: any) => any) => {
    queryClient.setQueryData(['cart'], updater);
  },

  // Update favorites optimistically
  toggleFavorite: (queryClient: QueryClient, nftId: string, isFavorite: boolean) => {
    queryClient.setQueryData(['favorites'], (old: any) => {
      if (!old?.data) return old;
      if (isFavorite) {
        return {
          ...old,
          data: [...old.data, { nftId, addedAt: new Date().toISOString() }],
        };
      }
      return {
        ...old,
        data: old.data.filter((f: any) => f.nftId !== nftId),
      };
    });

    // Also update NFT favorite count
    queryClient.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((nft: any) =>
          nft.id === nftId
            ? { ...nft, stats: { ...nft.stats, favorites: nft.stats.favorites + (isFavorite ? 1 : -1) } }
            : nft
        ),
      };
    });

    queryClient.setQueryData(['nft', nftId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        stats: { ...old.stats, favorites: old.stats.favorites + (isFavorite ? 1 : -1) },
      };
    });
  },
};

// ============================================
// WebSocket Event Integration
// ============================================

export const handleWebSocketEvent = (
  queryClient: QueryClient,
  event: { event: string; payload: any; version: number }
) => {
  switch (event.event) {
    case 'nft.updated': {
      const { nftId, price, status, edition, version } = event.payload;

      // Check version to avoid applying stale events
      const cachedNFT = queryClient.getQueryData(['nft', nftId]);
      if (cachedNFT && (cachedNFT as any).version >= version) {
        return; // Already have newer data
      }

      // Update NFT detail
      optimisticHelpers.updateNFT(queryClient, nftId, {
        price,
        status,
        edition,
      });

      // Update version separately
      queryClient.setQueryData(['nft', nftId], (old: any) => {
        if (!old) return old;
        return { ...old, version };
      });
      queryClient.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((nft: any) =>
            nft.id === nftId ? { ...nft, version } : nft
          ),
        };
      });

      break;
    }

    case 'order.updated': {
      const { orderId, status, transactionHash, blockNumber, failureReason, version } = event.payload;

      // Update order detail
      queryClient.setQueryData(['order', orderId], (old: any) => {
        if (!old) return old;
        // Check version
        if (old.version >= version) return old;
        return {
          ...old,
          status,
          transactionHash,
          blockNumber,
          failureReason,
          version,
          updatedAt: new Date().toISOString(),
        };
      });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      // If confirmed, remove from cart
      if (status === 'confirmed') {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }

      break;
    }
  }
};