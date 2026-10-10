/**
 * API Contracts - TypeScript types for all REST API resources
 * These types define the contract between frontend and backend (mocked via MSW)
 */

// ============================================
// Common Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  statusCode: number;
  timestamp: string;
  path: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

// ============================================
// Authentication & Session
// ============================================

export type EnsDomain = '.eth';

export interface User {
  id: string;
  email: string;
  name: string;
  /** Public handle, e.g. "emerald_ape" */
  username?: string;
  /** ENS label without the domain suffix, e.g. "emerald" */
  ensName?: string;
  ensDomain?: EnsDomain;
  /** Default nickname used for the collector's wallets */
  walletAlias?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  wallets: Wallet[];
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  ensName?: string;
  ensDomain?: EnsDomain;
  walletAlias?: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// NFTs
// ============================================

export type NFTStatus = 'available' | 'reserved' | 'sold' | 'hidden';
export type NFTSortField = 'price' | 'createdAt' | 'name' | 'popularity';
export type SortOrder = 'asc' | 'desc';

export interface NFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  externalUrl?: string;
  collection: Collection;
  creator: UserSummary;
  owner: UserSummary;
  price: PriceInfo;
  royalty: RoyaltyInfo;
  properties: NFTProperty[];
  stats: NFTStats;
  status: NFTStatus;
  edition: EditionInfo;
  createdAt: string;
  updatedAt: string;
  listedAt?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  verified: boolean;
  stats: CollectionStats;
  createdAt: string;
}

export interface CollectionStats {
  totalItems: number;
  owners: number;
  floorPrice: string; // ETH as decimal string
  volumeTraded: string; // ETH as decimal string
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface PriceInfo {
  amount: string; // ETH as decimal string
  currency: 'ETH';
  usdEquivalent?: number;
}

export interface RoyaltyInfo {
  basisPoints: number; // e.g., 250 = 2.5%
  recipient: string;
}

export interface NFTProperty {
  key: string;
  value: string | number;
  displayType?: 'string' | 'number' | 'date' | 'boost_number' | 'boost_percentage';
  rarity?: number; // percentage
}

export interface NFTStats {
  views: number;
  favorites: number;
  offers: number;
}

export interface EditionInfo {
  total: number;
  available: number;
  reserved: number;
  sold: number;
}

export interface NFTListParams {
  search?: string;
  collectionId?: string;
  creatorId?: string;
  ownerId?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: NFTStatus;
  properties?: Record<string, string[]>;
  sortBy?: NFTSortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export interface NFTListResponse extends PaginatedResponse<NFT> {}

// ============================================
// Favorites
// ============================================

export interface Favorite {
  id: string;
  userId: string;
  nftId: string;
  nft: NFT;
  createdAt: string;
}

export interface FavoriteToggleRequest {
  nftId: string;
}

// ============================================
// Cart
// ============================================

export interface CartItem {
  id: string;
  nftId: string;
  nft: NFT;
  quantity: number;
  unitPrice: string; // ETH as decimal string
  totalPrice: string; // ETH as decimal string
  addedAt: string;
  expiresAt?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: string; // ETH as decimal string
  itemCount: number;
  coupon?: AppliedCoupon;
  discount: string; // ETH as decimal string
  networkFee: string; // ETH as decimal string
  total: string; // ETH as decimal string
  updatedAt: string;
  expiresAt?: string;
}

export interface AddToCartRequest {
  nftId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: string; // percentage (0-100) or fixed amount in ETH
  discount: string; // ETH as decimal string
  validUntil: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: AppliedCoupon;
  error?: string;
}

// ============================================
// Quote / Pricing
// ============================================

export interface QuoteRequest {
  items: QuoteItemRequest[];
  couponCode?: string;
  walletAddress?: string;
  network?: string;
}

export interface QuoteItemRequest {
  nftId: string;
  quantity: number;
}

export interface QuoteResponse {
  quoteId: string;
  items: QuoteItemResponse[];
  subtotal: string; // ETH as decimal string
  discount: string; // ETH as decimal string
  networkFee: string; // ETH as decimal string
  total: string; // ETH as decimal string
  currency: 'ETH';
  exchangeRate: number; // ETH to USD
  validUntil: string;
  warnings?: QuoteWarning[];
}

export interface QuoteItemResponse {
  nftId: string;
  nft: NFT;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  available: boolean;
  priceChanged: boolean;
}

export interface QuoteWarning {
  type: 'price_changed' | 'availability_changed' | 'coupon_expired' | 'network_congestion';
  message: string;
  nftId?: string;
}

// ============================================
// Orders
// ============================================

export type OrderStatus = 'pending' | 'confirming' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
export type OrderType = 'purchase' | 'offer' | 'listing';

export interface Order {
  id: string;
  idempotencyKey: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  quote: QuoteResponse;
  payment: PaymentInfo;
  transactionHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  expiresAt: string;
}

export interface OrderItem {
  nftId: string;
  nft: NFT;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface PaymentInfo {
  walletAddress: string;
  network: string;
  chainId: number;
  gasEstimate?: string;
  gasPrice?: string;
}

export interface CreateOrderRequest {
  idempotencyKey: string;
  quoteId: string;
  walletAddress: string;
  network: string;
  collectorInfo: CollectorInfo;
}

export interface CollectorInfo {
  email: string;
  name: string;
  /** Wallet address chosen for the purchase */
  address?: string;
  username?: string;
  profileName?: string;
  referralCode?: string;
  ensName?: string;
  ensDomain?: EnsDomain;
  /** ENS or secondary wallet (optional) */
  linkedAddress?: string;
  walletProvider?: WalletProvider;
  notes?: string;
}

export interface OrderStatusResponse {
  order: Order;
  status: OrderStatus;
  transactionHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
}

// ============================================
// Wallets
// ============================================

export type WalletType = 'primary' | 'secondary';
export type WalletNetwork = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase';

/** Collector metadata stored together with a wallet ("Carteiras" form) */
export interface WalletMetadata {
  provider?: WalletProvider;
  displayName?: string;
  profileName?: string;
  email?: string;
  referralCode?: string;
  ensName?: string;
  ensDomain?: EnsDomain;
  /** ENS or secondary wallet (optional) */
  linkedAddress?: string;
}

export interface Wallet extends WalletMetadata {
  id: string;
  userId: string;
  type: WalletType;
  address: string;
  network: WalletNetwork;
  chainId: number;
  name: string;
  isConnected: boolean;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddWalletRequest extends WalletMetadata {
  type: WalletType;
  address: string;
  network: WalletNetwork;
  chainId: number;
  name: string;
}

export interface UpdateWalletRequest extends WalletMetadata {
  name?: string;
  isConnected?: boolean;
}

// ============================================
// WebSocket Events
// ============================================

export interface WSEvent<T = unknown> {
  event: string;
  payload: T;
  timestamp: string;
  version: number;
  idempotencyKey?: string;
}

export interface NFTUpdatedEvent {
  nftId: string;
  price?: PriceInfo;
  status?: NFTStatus;
  edition?: EditionInfo;
  version: number;
}

export interface OrderUpdatedEvent {
  orderId: string;
  status: OrderStatus;
  transactionHash?: string;
  blockNumber?: number;
  failureReason?: string;
  version: number;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================
// Form Validation Schemas (Zod-ready)
// ============================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const ETH_DECIMAL_REGEX = /^\d+(\.\d{1,18})?$/;

export interface FormFieldError {
  field: string;
  message: string;
}