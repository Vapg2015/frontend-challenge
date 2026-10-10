/**
 * Mock Data Fixtures
 * Deterministic test data for development, testing, and demos
 */

import type { NFT, Collection, User, Wallet, Cart, Order, Favorite, AppliedCoupon } from '@/api/contracts';

// ============================================
// Users
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'alice@example.com',
    name: 'Alice Collector',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-15T14:30:00Z',
    emailVerified: true,
    wallets: [],
  },
  {
    id: 'user_2',
    email: 'bob@example.com',
    name: 'Bob Trader',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    createdAt: '2024-02-20T08:00:00Z',
    updatedAt: '2024-06-10T12:00:00Z',
    emailVerified: true,
    wallets: [],
  },
];

// ============================================
// Collections
// ============================================

export const mockCollections: Collection[] = [
  {
    id: 'coll_1',
    name: 'CryptoPunks',
    slug: 'cryptopunks',
    description: 'The original NFT collection on Ethereum. 10,000 unique collectible characters.',
    imageUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=1200&h=400&fit=crop',
    verified: true,
    stats: {
      totalItems: 10000,
      owners: 3400,
      floorPrice: '45.5',
      volumeTraded: '1250000',
    },
    createdAt: '2021-06-01T00:00:00Z',
  },
  {
    id: 'coll_2',
    name: 'Bored Ape Yacht Club',
    slug: 'bayc',
    description: '10,000 unique Bored Ape NFTs. Membership to the club.',
    imageUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=1200&h=400&fit=crop',
    verified: true,
    stats: {
      totalItems: 10000,
      owners: 6200,
      floorPrice: '28.3',
      volumeTraded: '980000',
    },
    createdAt: '2021-04-30T00:00:00Z',
  },
  {
    id: 'coll_3',
    name: 'Art Blocks Curated',
    slug: 'art-blocks-curated',
    description: 'Generative art projects curated by the Art Blocks team.',
    imageUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
    verified: true,
    stats: {
      totalItems: 50000,
      owners: 12000,
      floorPrice: '2.1',
      volumeTraded: '450000',
    },
    createdAt: '2021-08-01T00:00:00Z',
  },
  {
    id: 'coll_4',
    name: 'Doodles',
    slug: 'doodles',
    description: '10,000 colorful characters by Burnt Toast.',
    imageUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
    verified: true,
    stats: {
      totalItems: 10000,
      owners: 4500,
      floorPrice: '8.7',
      volumeTraded: '320000',
    },
    createdAt: '2021-10-01T00:00:00Z',
  },
  {
    id: 'coll_5',
    name: 'Azuki',
    slug: 'azuki',
    description: '10,000 anime-style avatars for the metaverse.',
    imageUrl: 'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
    verified: true,
    stats: {
      totalItems: 10000,
      owners: 3800,
      floorPrice: '12.4',
      volumeTraded: '280000',
    },
    createdAt: '2022-01-15T00:00:00Z',
  },
];

// ============================================
// NFTs
// ============================================

const nftImages = [
  'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1634987051524-5b8e5e8a8a8a?w=400&h=400&fit=crop',
];

function generateNFTs(): NFT[] {
  const nfts: NFT[] = [];
  let nftIndex = 1;

  for (const collection of mockCollections) {
    const itemsPerCollection = 20;
    for (let i = 0; i < itemsPerCollection; i++) {
      const price = (Math.random() * 50 + 0.5).toFixed(4);
      const totalEdition = Math.floor(Math.random() * 100) + 10;
      const sold = Math.floor(Math.random() * (totalEdition * 0.8));
      const reserved = Math.floor(Math.random() * 5);
      const available = totalEdition - sold - reserved;

      nfts.push({
        id: `nft_${nftIndex}`,
        contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        tokenId: `${Math.floor(Math.random() * 10000)}`,
        name: `${collection.name} #${nftIndex}`,
        description: `A unique ${collection.name.toLowerCase()} collectible. Edition ${i + 1} of ${totalEdition}.`,
        imageUrl: nftImages[Math.floor(Math.random() * nftImages.length)],
        animationUrl: Math.random() > 0.7 ? `https://example.com/animations/${nftIndex}.mp4` : undefined,
        externalUrl: `https://opensea.io/assets/ethereum/${collection.slug}/${nftIndex}`,
        collection,
        creator: {
          id: 'creator_1',
          name: 'Creator',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator',
          verified: true,
        },
        owner: (() => {
          const u = mockUsers[Math.floor(Math.random() * mockUsers.length)];
          return { id: u.id, name: u.name, avatarUrl: u.avatarUrl, verified: u.emailVerified };
        })(),
        price: {
          amount: price,
          currency: 'ETH',
          usdEquivalent: parseFloat(price) * 2400,
        },
        royalty: {
          basisPoints: 250,
          recipient: '0x1234567890123456789012345678901234567890',
        },
        properties: [
          { key: 'Background', value: ['Blue', 'Red', 'Green', 'Yellow', 'Purple'][Math.floor(Math.random() * 5)], rarity: Math.random() * 100 },
          { key: 'Body', value: ['Human', 'Zombie', 'Ape', 'Alien', 'Robot'][Math.floor(Math.random() * 5)], rarity: Math.random() * 100 },
          { key: 'Accessory', value: ['None', 'Hat', 'Glasses', 'Earring', 'Necklace'][Math.floor(Math.random() * 5)], rarity: Math.random() * 100 },
        ],
        stats: {
          views: Math.floor(Math.random() * 10000),
          favorites: Math.floor(Math.random() * 500),
          offers: Math.floor(Math.random() * 50),
        },
        status: available > 0 ? 'available' : 'sold',
        edition: {
          total: totalEdition,
          available: Math.max(0, available),
          reserved,
          sold,
        },
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        listedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      nftIndex++;
    }
  }

  return nfts;
}

export const mockNFTs = generateNFTs();

// ============================================
// Wallets
// ============================================

export const mockWallets: Wallet[] = [
  {
    id: 'wallet_1',
    userId: 'user_1',
    type: 'primary',
    address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
    network: 'ethereum',
    chainId: 1,
    name: 'Main Wallet',
    isConnected: true,
    lastConnectedAt: new Date().toISOString(),
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-15T14:30:00Z',
  },
  {
    id: 'wallet_2',
    userId: 'user_1',
    type: 'secondary',
    address: '0x842d35Cc6634C0532925a3b8D4C0532925a3b8D5',
    network: 'polygon',
    chainId: 137,
    name: 'Polygon Wallet',
    isConnected: false,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'wallet_3',
    userId: 'user_2',
    type: 'primary',
    address: '0x942d35Cc6634C0532925a3b8D4C0532925a3b8D6',
    network: 'ethereum',
    chainId: 1,
    name: 'Main Wallet',
    isConnected: true,
    lastConnectedAt: new Date().toISOString(),
    createdAt: '2024-02-20T08:00:00Z',
    updatedAt: '2024-06-10T12:00:00Z',
  },
];

// ============================================
// Carts
// ============================================

export const mockCarts: Record<string, Cart> = {
  guest: {
    id: 'cart_guest',
    sessionId: 'session_guest',
    items: [],
    subtotal: '0',
    itemCount: 0,
    discount: '0',
    networkFee: '0.002',
    total: '0.002',
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  user_1: {
    id: 'cart_user_1',
    userId: 'user_1',
    items: [
      {
        id: 'cart_item_1',
        nftId: 'nft_1',
        nft: mockNFTs[0],
        quantity: 2,
        unitPrice: mockNFTs[0].price.amount,
        totalPrice: (parseFloat(mockNFTs[0].price.amount) * 2).toFixed(4),
        addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    subtotal: (parseFloat(mockNFTs[0].price.amount) * 2).toFixed(4),
    itemCount: 2,
    discount: '0',
    networkFee: '0.002',
    total: (parseFloat(mockNFTs[0].price.amount) * 2 + 0.002).toFixed(4),
    updatedAt: new Date().toISOString(),
  },
};

// ============================================
// Coupons
// ============================================

export const mockCoupons: Record<string, AppliedCoupon> = {
  WELCOME10: {
    code: 'WELCOME10',
    type: 'percentage',
    value: '10',
    discount: '0',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  SAVE5: {
    code: 'SAVE5',
    type: 'fixed',
    value: '0.05',
    discount: '0',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  EXPIRED: {
    code: 'EXPIRED',
    type: 'percentage',
    value: '20',
    discount: '0',
    validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
};

// ============================================
// Orders
// ============================================

export const mockOrders: Order[] = [
  {
    id: 'order_1',
    idempotencyKey: 'idem_1234567890_abc123',
    userId: 'user_1',
    type: 'purchase',
    status: 'confirmed',
    items: [
      {
        nftId: 'nft_5',
        nft: mockNFTs[4],
        quantity: 1,
        unitPrice: mockNFTs[4].price.amount,
        totalPrice: mockNFTs[4].price.amount,
      },
    ],
    quote: {
      quoteId: 'quote_1',
      items: [
        {
          nftId: 'nft_5',
          nft: mockNFTs[4],
          quantity: 1,
          unitPrice: mockNFTs[4].price.amount,
          totalPrice: mockNFTs[4].price.amount,
          available: true,
          priceChanged: false,
        },
      ],
      subtotal: mockNFTs[4].price.amount,
      discount: '0',
      networkFee: '0.002',
      total: (parseFloat(mockNFTs[4].price.amount) + 0.002).toFixed(4),
      currency: 'ETH',
      exchangeRate: 2400,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    payment: {
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      network: 'ethereum',
      chainId: 1,
      gasEstimate: '0.0015',
      gasPrice: '25000000000',
    },
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    blockNumber: 18500000,
    explorerUrl: 'https://etherscan.io/tx/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'order_2',
    idempotencyKey: 'idem_1234567891_def456',
    userId: 'user_1',
    type: 'purchase',
    status: 'rejected',
    items: [
      {
        nftId: 'nft_10',
        nft: mockNFTs[9],
        quantity: 1,
        unitPrice: mockNFTs[9].price.amount,
        totalPrice: mockNFTs[9].price.amount,
      },
    ],
    quote: {
      quoteId: 'quote_2',
      items: [
        {
          nftId: 'nft_10',
          nft: mockNFTs[9],
          quantity: 1,
          unitPrice: mockNFTs[9].price.amount,
          totalPrice: mockNFTs[9].price.amount,
          available: true,
          priceChanged: false,
        },
      ],
      subtotal: mockNFTs[9].price.amount,
      discount: '0',
      networkFee: '0.002',
      total: (parseFloat(mockNFTs[9].price.amount) + 0.002).toFixed(4),
      currency: 'ETH',
      exchangeRate: 2400,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    payment: {
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      network: 'ethereum',
      chainId: 1,
      gasEstimate: '0.0015',
      gasPrice: '25000000000',
    },
    failureReason: 'Insufficient balance for gas fees',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Favorites
// ============================================

export const mockFavorites: Favorite[] = [
  {
    id: 'fav_1',
    userId: 'user_1',
    nftId: 'nft_3',
    nft: mockNFTs[2],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fav_2',
    userId: 'user_1',
    nftId: 'nft_7',
    nft: mockNFTs[6],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fav_3',
    userId: 'user_2',
    nftId: 'nft_15',
    nft: mockNFTs[14],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Network Configurations
// ============================================

export const supportedNetworks = [
  { id: 'ethereum', name: 'Ethereum', chainId: 1, symbol: 'ETH', rpcUrl: 'https://eth.llamarpc.com', explorerUrl: 'https://etherscan.io' },
  { id: 'polygon', name: 'Polygon', chainId: 137, symbol: 'MATIC', rpcUrl: 'https://polygon-rpc.com', explorerUrl: 'https://polygonscan.com' },
  { id: 'arbitrum', name: 'Arbitrum', chainId: 42161, symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc', explorerUrl: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', chainId: 10, symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io', explorerUrl: 'https://optimistic.etherscan.io' },
  { id: 'base', name: 'Base', chainId: 8453, symbol: 'ETH', rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org' },
] as const;

export type SupportedNetwork = typeof supportedNetworks[number]['id'];