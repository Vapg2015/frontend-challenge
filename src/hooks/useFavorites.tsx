/**
 * Favorites Hook
 * Manages user favorites with optimistic updates and persistence
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { queryKeys, optimisticHelpers } from '../api/queryClient';
import type { Favorite } from '../api/contracts';

// ============================================
// Types
// ============================================

interface FavoritesContextType {
  favorites: Favorite[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  toggleFavorite: (nftId: string) => Promise<void>;
  addFavorite: (nftId: string) => Promise<void>;
  removeFavorite: (nftId: string) => Promise<void>;
  isFavorite: (nftId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Context Creation
// ============================================

const FavoritesContext = createContext<FavoritesContextType | null>(null);

// ============================================
// Provider Component
// ============================================

interface FavoritesProviderProps {
  children: ReactNode;
  userId?: string;
}

// Type for the mutation response - can be either Favorite (add) or { nftId: string } (remove)
type ToggleFavoriteResponse = { data: Favorite } | { data: { nftId: string } };

export const FavoritesProvider = ({ children, userId }: FavoritesProviderProps) => {
  const queryClient = useQueryClient();

  // ============================================
  // Favorites Query
  // ============================================

  const { data: favoritesData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.favorites(userId),
    queryFn: () => api.get<Favorite[]>('/favorites'),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const favorites = favoritesData?.data || [];
  const favoriteIds = new Set(favorites.map((f) => f.nftId));

  // ============================================
  // Mutations
  // ============================================

  const toggleFavoriteMutation = useMutation<ToggleFavoriteResponse, Error, string, { previousFavorites: Favorite[] | undefined }>({
    mutationFn: async (nftId: string) => {
      const isFav = favoriteIds.has(nftId);
      if (isFav) {
        const response = await api.delete<{ data: { nftId: string } }>(`/favorites/${nftId}`);
        return { data: { nftId: response.data.data.nftId } };
      }
      const response = await api.post<{ data: Favorite }>('/favorites', { nftId });
      return { data: response.data.data };
    },
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites(userId) });
      const previousFavorites = queryClient.getQueryData<Favorite[]>(queryKeys.favorites(userId));

      const isFav = favoriteIds.has(nftId);

      // Optimistic update
      optimisticHelpers.toggleFavorite(queryClient, nftId, !isFav);

      return { previousFavorites };
    },
    onError: (_err, _nftId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites(userId), context.previousFavorites);
        // Also revert NFT favorite counts
        optimisticHelpers.toggleFavorite(queryClient, _nftId, favoriteIds.has(_nftId));
      }
    },
    onSuccess: (response, nftId) => {
      // Update favorites list with server response
      queryClient.setQueryData<Favorite[]>(queryKeys.favorites(userId), (old) => {
        if (!old) return old;
        // Check if it was previously a favorite (we're removing)
        const wasFavorite = old.some((f) => f.nftId === nftId);
        if (wasFavorite) {
          return old.filter((f) => f.nftId !== nftId);
        }
        // Adding new favorite - response.data should be the Favorite object
        if ('nftId' in response.data && !('id' in response.data)) {
          // This is the delete response, shouldn't happen here but handle gracefully
          return old;
        }
        return [...old, response.data as Favorite];
      });
    },
  });

  // ============================================
  // Actions
  // ============================================

  const toggleFavorite = useCallback(async (nftId: string) => {
    await toggleFavoriteMutation.mutateAsync(nftId);
  }, [toggleFavoriteMutation]);

  const addFavorite = useCallback(async (nftId: string) => {
    if (!favoriteIds.has(nftId)) {
      await toggleFavoriteMutation.mutateAsync(nftId);
    }
  }, [toggleFavoriteMutation, favoriteIds]);

  const removeFavorite = useCallback(async (nftId: string) => {
    if (favoriteIds.has(nftId)) {
      await toggleFavoriteMutation.mutateAsync(nftId);
    }
  }, [toggleFavoriteMutation, favoriteIds]);

  const isFavorite = useCallback((nftId: string) => {
    return favoriteIds.has(nftId);
  }, [favoriteIds]);

  const refreshFavorites = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearError = useCallback(() => {
    // Clear error if needed
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        isLoading,
        error: null,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
        clearError,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};