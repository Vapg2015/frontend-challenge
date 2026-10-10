/**
 * NFT Filters Component
 * Search, filters and sorting. The URL is the single source of truth:
 * every change rewrites the search params and resets pagination.
 */

import { useEffect, useState } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { X, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { HomeSearch } from '@/router';
import type { NFTSortField, NFTStatus, SortOrder } from '@/api/contracts';

interface NFTFiltersProps {
  collections: Array<{ id: string; name: string }>;
}

const ALL = '__all__';

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'name:asc', label: 'Name: A-Z' },
  { value: 'name:desc', label: 'Name: Z-A' },
  { value: 'popularity:desc', label: 'Most Popular' },
];

export function NFTFilters({ collections }: NFTFiltersProps) {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });

  const [queryDraft, setQueryDraft] = useState(search.search ?? '');
  const [minDraft, setMinDraft] = useState(search.minPrice ?? '');
  const [maxDraft, setMaxDraft] = useState(search.maxPrice ?? '');

  // Keep drafts in sync when the URL changes from outside (history navigation, clear all)
  useEffect(() => setQueryDraft(search.search ?? ''), [search.search]);
  useEffect(() => setMinDraft(search.minPrice ?? ''), [search.minPrice]);
  useEffect(() => setMaxDraft(search.maxPrice ?? ''), [search.maxPrice]);

  const update = (updates: Partial<HomeSearch>, replace = false) => {
    navigate({
      search: (prev) => {
        const next = { ...prev, ...updates, page: undefined };
        return Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '')) as HomeSearch;
      },
      replace,
    });
  };

  // Debounced text inputs (replace history entries while typing)
  useEffect(() => {
    if ((search.search ?? '') === queryDraft.trim()) return;
    const t = setTimeout(() => update({ search: queryDraft.trim() || undefined }, true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft]);

  useEffect(() => {
    if ((search.minPrice ?? '') === minDraft && (search.maxPrice ?? '') === maxDraft) return;
    const t = setTimeout(() => update({ minPrice: minDraft || undefined, maxPrice: maxDraft || undefined }, true), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDraft, maxDraft]);

  const sortValue = `${search.sortBy ?? 'createdAt'}:${search.sortOrder ?? 'desc'}`;
  const hasActiveFilters = !!(
    search.collection || search.status || search.minPrice || search.maxPrice || sortValue !== 'createdAt:desc'
  );

  const clearAll = () =>
    navigate({ search: search.search ? { search: search.search } : {}, replace: false });

  return (
    <div className="space-y-4" role="search" aria-label="Filter NFTs">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search NFTs, collections, creators..."
          value={queryDraft}
          onChange={(e) => setQueryDraft(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-base placeholder:text-text-muted focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Search NFTs"
        />
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {search.collection && (
            <FilterChip
              label={`Collection: ${collections.find((c) => c.id === search.collection)?.name ?? search.collection}`}
              onRemove={() => update({ collection: undefined })}
              removeLabel="Remove collection filter"
            />
          )}
          {search.status && (
            <FilterChip
              label={`Status: ${search.status}`}
              onRemove={() => update({ status: undefined })}
              removeLabel="Remove status filter"
            />
          )}
          {search.minPrice && (
            <FilterChip
              label={`Min: ${search.minPrice} ETH`}
              onRemove={() => update({ minPrice: undefined })}
              removeLabel="Remove min price filter"
            />
          )}
          {search.maxPrice && (
            <FilterChip
              label={`Max: ${search.maxPrice} ETH`}
              onRemove={() => update({ maxPrice: undefined })}
              removeLabel="Remove max price filter"
            />
          )}
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-text-muted hover:text-error">
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Select
          value={search.collection ?? ALL}
          onValueChange={(v) => update({ collection: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-full" aria-label="Collection">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={search.status ?? ALL}
          onValueChange={(v) => update({ status: v === ALL ? undefined : (v as NFTStatus) })}
        >
          <SelectTrigger className="w-full" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Min (ETH)"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            step="0.001"
            min="0"
            aria-label="Minimum price in ETH"
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Max (ETH)"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            step="0.001"
            min="0"
            aria-label="Maximum price in ETH"
          />
        </div>

        <Select
          value={sortValue}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split(':') as [NFTSortField, SortOrder];
            update({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-full" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  return (
    <Badge variant="primary" className="gap-1">
      {label}
      <button type="button" onClick={onRemove} className="ml-1 hover:text-error" aria-label={removeLabel}>
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </Badge>
  );
}