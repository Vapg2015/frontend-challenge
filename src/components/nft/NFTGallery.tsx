/**
 * NFT Gallery Component
 * Image gallery for NFT detail page
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { NFT } from '@/api/contracts';

interface NFTGalleryProps {
  nft: NFT;
  className?: string;
}

export function NFTGallery({ nft, className }: NFTGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const images = [
    nft.imageUrl,
    ...(nft.animationUrl ? [nft.animationUrl] : []),
  ].filter(Boolean);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFullscreen) return;
    if (e.key === 'ArrowLeft') {
      setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else if (e.key === 'ArrowRight') {
      setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Main Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-background">
          <img
            src={images[selectedIndex]}
            alt={`${nft.name} - Image ${selectedIndex + 1} of ${images.length}`}
            className="w-full h-full object-cover"
            onClick={() => images.length > 1 && openFullscreen(selectedIndex)}
          />

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'p-1 rounded bg-surface/90 backdrop-blur transition-all',
                    index === selectedIndex
                      ? 'ring-2 ring-primary scale-110'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === selectedIndex ? 'true' : 'false'}
                >
                  <img
                    src={images[index]}
                    alt=""
                    className="h-10 w-10 object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Modal */}
        {isFullscreen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={closeFullscreen}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={`${nft.name} - Fullscreen view`}
          >
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Close fullscreen"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
              className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors hidden sm:block"
              aria-label="Previous image"
            >
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative max-w-[90vw] max-h-[90vh]">
              {images[selectedIndex]?.endsWith('.mp4') ? (
                <video
                  src={images[selectedIndex]}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={images[selectedIndex]}
                  alt={`${nft.name} - Image ${selectedIndex + 1} of ${images.length}`}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                />
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
              className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors hidden sm:block"
              aria-label="Next image"
            >
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Thumbnails in fullscreen */}
            {images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
                    className={cn(
                      'p-1 rounded bg-white/10 transition-all',
                      index === selectedIndex
                        ? 'ring-2 ring-primary scale-110'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={images[index]}
                      alt=""
                      className="h-12 w-12 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}