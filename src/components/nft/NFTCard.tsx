/**
 * NFT Card Component
 * Display NFT in catalog grid
 */

import { Link } from '@tanstack/react-router';
import { useFavorites } from '@/hooks/useFavorites';
import { formatETH, formatCompactNumber } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Heart, Heart as HeartFilled, Eye } from 'lucide-react';
import type { NFT } from '@/api/contracts';

interface NFTCardProps {
  nft: NFT;
  isLoading?: boolean;
  priority?: boolean;
}

export function NFTCard({ nft, isLoading, priority }: NFTCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (isLoading) {
    return <SkeletonCard />;
  }

  const favoriteStatus = isFavorite(nft.id);

  return (
    <article className="group">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        search={{ tab: 'details' }}
        className="block card overflow-hidden transition-all duration-300 hover:shadow-lg"
        aria-label={`View ${nft.name}`}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-background">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            width={400}
            height={400}
          />

          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant={
                nft.status === 'available' ? 'success' :
                nft.status === 'reserved' ? 'warning' :
                'neutral'
              }
              className="text-xs"
            >
              {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
            </Badge>
            {nft.edition.available > 0 && nft.edition.available < 10 && (
              <Badge variant="warning" className="text-xs">
                Only {nft.edition.available} left
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(nft.id);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-surface/90 backdrop-blur text-text-secondary hover:text-error hover:bg-background transition-colors"
            aria-label={favoriteStatus ? `Remove ${nft.name} from favorites` : `Add ${nft.name} to favorites`}
            aria-pressed={favoriteStatus}
          >
            {favoriteStatus ? (
              <HeartFilled className="h-5 w-5 fill-current text-error" />
            ) : (
              <Heart className="h-5 w-5" />
            )}
          </button>

          {/* Collection Verified */}
          {nft.collection.verified && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-surface/90 backdrop-blur rounded-full">
              <svg className="h-3 w-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-text-primary">Verified</span>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Collection Name */}
          <div className="flex items-center gap-2">
            <a
              href={`/collections/${nft.collection.slug}`}
              className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {nft.collection.name}
            </a>
            {nft.collection.verified && (
              <svg className="h-3 w-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* NFT Name */}
          <h3 className="text-base font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
            {nft.name}
          </h3>

          {/* Creator */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <img
              src={nft.creator.avatarUrl}
              alt={nft.creator.name}
              className="h-5 w-5 rounded-full"
            />
            <span className="truncate">{nft.creator.name}</span>
            {nft.creator.verified && (
              <svg className="h-3 w-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Stats & Price */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1" title="Views">
                <Eye className="h-3.5 w-3.5" />
                {formatCompactNumber(nft.stats.views)}
              </span>
              <span className="flex items-center gap-1" title="Favorites">
                <Heart className="h-3.5 w-3.5" />
                {formatCompactNumber(nft.stats.favorites)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-text-primary">
                {formatETH(nft.price.amount)}
              </p>
              {nft.price.usdEquivalent && (
                <p className="text-xs text-text-muted">
                  ≈ {formatETH(nft.price.usdEquivalent.toString())}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </article>
  );
}