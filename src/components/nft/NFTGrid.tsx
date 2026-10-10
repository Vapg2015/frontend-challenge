/**
 * NFT Grid Component
 * Responsive grid layout for NFT cards
 */

import { NFTCard } from './NFTCard';
import type { NFT } from '@/api/contracts';

interface NFTGridProps {
  nfts: NFT[];
  isLoading?: boolean;
  loadingCount?: number;
}

export function NFTGrid({ nfts, isLoading, loadingCount = 8 }: NFTGridProps) {
  if (isLoading && nfts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
        {Array.from({ length: loadingCount }).map((_, i) => (
          <NFTCard key={i} nft={null as any} isLoading={true} />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="col-span-full py-16 text-center">
        <svg className="mx-auto h-12 w-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-text-primary">No NFTs found</h3>
        <p className="mt-1 text-text-muted">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
      {nfts.map((nft, index) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          priority={index < 4}
        />
      ))}
    </div>
  );
}