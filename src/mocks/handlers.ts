/**
 * MSW Request Handlers
 * REST API mock handlers with proper error handling and scenarios
 */

import { http, HttpResponse, delay } from 'msw';
import { store, randomDelay, shouldSimulateError, setErrorScenario, resetStoreToScenario } from './data/store';
import type { ErrorScenario } from './data/store';
import type {
  User, Session, LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateProfileRequest,
  NFTListParams, PaginatedResponse, CartItem, AddToCartRequest, UpdateCartItemRequest,
  ApplyCouponRequest, QuoteRequest, QuoteResponse, QuoteItemResponse,
  Order, CreateOrderRequest, Wallet, AddWalletRequest, UpdateWalletRequest,
  Favorite, FavoriteToggleRequest, ApiResponse, ApiError
} from '@/api/contracts';

// ============================================
// Helper Functions
// ============================================

function createApiResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: '1.0.0',
      ...meta,
    },
  };
}

function createPaginatedResponse<T>(data: T[], page: number, pageSize: number, totalItems: number): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      hasNext: page * pageSize < totalItems,
      hasPrev: page > 1,
    },
  };
}

function createErrorResponse(statusCode: number, code: string, message: string, details?: Record<string, string[]>): HttpResponse<ApiError> {
  const error: ApiError = {
    code,
    message,
    details,
    statusCode,
    timestamp: new Date().toISOString(),
    path: '',
  };
  return HttpResponse.json(error, { status: statusCode });
}

function getAuthUser(request: Request): User | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  // In a real app, you'd validate the JWT
  // For mock, we'll use a simple token format: "user_<id>"
  const token = authHeader.substring(7);
  if (token.startsWith('user_')) {
    const userId = token.substring(5);
    return store.getUserById(userId) || null;
  }

  // Try to find user by session
  // This is simplified for mocking
  return null;
}

function requireAuth(request: Request): User | HttpResponse<ApiError> {
  const user = getAuthUser(request);
  if (!user) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return user;
}

async function handleRequest<T>(
  _request: Request,
  handler: () => Promise<T | HttpResponse<any>>
): Promise<HttpResponse<any>> {
  // Simulate network conditions
  const errorCheck = shouldSimulateError();
  if (errorCheck.shouldError) {
    if (errorCheck.delay) await delay(errorCheck.delay);
    return createErrorResponse(
      errorCheck.statusCode || 500,
      'NETWORK_ERROR',
      'Simulated network error'
    );
  }

  await randomDelay();

  try {
    const result = await handler();
    if (result instanceof HttpResponse) return result;
    return HttpResponse.json(createApiResponse(result));
  } catch (error) {
    console.error('Handler error:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

// ============================================
// Auth Handlers
// ============================================

export const authHandlers = [
  // POST /auth/register
  http.post('/api/auth/register', async ({ request }) => {
    return handleRequest(request, async () => {
      const body = await request.json() as RegisterRequest;

      // Validate
      if (!body.email || !body.password || !body.name) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Missing required fields', {
          email: body.email ? [] : ['Email is required'],
          password: body.password ? [] : ['Password is required'],
          name: body.name ? [] : ['Name is required'],
        });
      }

      // Check if user exists
      if (store.getUserByEmail(body.email)) {
        return createErrorResponse(409, 'CONFLICT', 'Este e-mail já está cadastrado', {
          email: ['Este e-mail já está cadastrado'],
        });
      }

      // Create user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: body.email,
        name: body.name,
        username: body.username || body.name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.email}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        wallets: [],
      };

      store.createUser(newUser);

      // Create session
      const accessToken = `user_${newUser.id}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      store.createSession(newUser.id, accessToken, refreshToken);

      const session: Session = {
        user: newUser,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return session;
    });
  }),

  // POST /auth/login
  http.post('/api/auth/login', async ({ request }) => {
    return handleRequest(request, async () => {
      const body = await request.json() as LoginRequest;

      const user = store.getUserByEmail(body.email);
      if (!user) {
        return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // In mock, any password works for existing users
      // In real app, you'd verify password hash

      const accessToken = `user_${user.id}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      store.createSession(user.id, accessToken, refreshToken);

      const session: Session = {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + (body.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString(),
      };

      return session;
    });
  }),

  // POST /auth/logout
  http.post('/api/auth/logout', async ({ request }) => {
    return handleRequest(request, async () => {
      const authHeader = request.headers.get('Authorization');
      // In real app, you'd invalidate the session identified by the bearer token
      void authHeader;
      return { success: true };
    });
  }),

  // GET /auth/session
  http.get('/api/auth/session', async ({ request }) => {
    return handleRequest(request, async () => {
      const user = getAuthUser(request);
      if (!user) {
        return createErrorResponse(401, 'UNAUTHORIZED', 'No active session');
      }

      const accessToken = `user_${user.id}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const session: Session = {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return session;
    });
  }),

  // POST /auth/refresh
  http.post('/api/auth/refresh', async ({ request }) => {
    return handleRequest(request, async () => {
      const body = await request.json() as { refreshToken: string };

      if (!body.refreshToken) {
        return createErrorResponse(401, 'INVALID_TOKEN', 'Refresh token required');
      }

      // In mock, any refresh token works
      // Extract user ID from refresh token or find by token
      const user = store.getUsers()[0]; // Simplified

      const accessToken = `user_${user.id}`;
      const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      };
    });
  }),

  // POST /auth/change-password
  http.post('/api/auth/change-password', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const body = await request.json() as ChangePasswordRequest;

      // In mock, just verify current password is not empty
      if (!body.currentPassword) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Current password required', {
          currentPassword: ['Current password is required'],
        });
      }

      return { success: true, message: 'Password changed successfully' };
    });
  }),
];

// ============================================
// NFT Handlers
// ============================================

export const nftHandlers = [
  // GET /nfts - List with filters, search, pagination
  http.get('/api/nfts', async ({ request }) => {
    return handleRequest(request, async () => {
      const url = new URL(request.url);
      const params: NFTListParams = {
        search: url.searchParams.get('search') || undefined,
        collectionId: url.searchParams.get('collectionId') || undefined,
        creatorId: url.searchParams.get('creatorId') || undefined,
        ownerId: url.searchParams.get('ownerId') || undefined,
        minPrice: url.searchParams.get('minPrice') || undefined,
        maxPrice: url.searchParams.get('maxPrice') || undefined,
        status: url.searchParams.get('status') as any || undefined,
        sortBy: url.searchParams.get('sortBy') as any || 'createdAt',
        sortOrder: url.searchParams.get('sortOrder') as any || 'desc',
        page: parseInt(url.searchParams.get('page') || '1'),
        pageSize: parseInt(url.searchParams.get('pageSize') || '20'),
      };

      let filteredNFTs = [...store.getNFTs()];

      // Apply filters
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredNFTs = filteredNFTs.filter(nft =>
          nft.name.toLowerCase().includes(search) ||
          nft.description.toLowerCase().includes(search) ||
          nft.collection.name.toLowerCase().includes(search)
        );
      }

      if (params.collectionId) {
        filteredNFTs = filteredNFTs.filter(nft => nft.collection.id === params.collectionId);
      }

      if (params.creatorId) {
        filteredNFTs = filteredNFTs.filter(nft => nft.creator.id === params.creatorId);
      }

      if (params.ownerId) {
        filteredNFTs = filteredNFTs.filter(nft => nft.owner.id === params.ownerId);
      }

      if (params.minPrice) {
        filteredNFTs = filteredNFTs.filter(nft => parseFloat(nft.price.amount) >= parseFloat(params.minPrice!));
      }

      if (params.maxPrice) {
        filteredNFTs = filteredNFTs.filter(nft => parseFloat(nft.price.amount) <= parseFloat(params.maxPrice!));
      }

      if (params.status) {
        filteredNFTs = filteredNFTs.filter(nft => nft.status === params.status);
      }

      // Apply sorting
      filteredNFTs.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (params.sortBy) {
          case 'price':
            aVal = parseFloat(a.price.amount);
            bVal = parseFloat(b.price.amount);
            break;
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'popularity':
            aVal = a.stats.views + a.stats.favorites * 10;
            bVal = b.stats.views + b.stats.favorites * 10;
            break;
          case 'createdAt':
          default:
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
        }

        if (aVal < bVal) return params.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Paginate
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const start = (page - 1) * pageSize;
      const paginatedData = filteredNFTs.slice(start, start + pageSize);

      return createPaginatedResponse(paginatedData, page, pageSize, filteredNFTs.length);
    });
  }),

  // GET /nfts/:id - Get NFT detail
  http.get('/api/nfts/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const nft = store.getNFTById(params.id as string);
      if (!nft) {
        return createErrorResponse(404, 'NOT_FOUND', 'NFT not found');
      }
      return nft;
    });
  }),

  // GET /collections
  http.get('/api/collections', async ({ request }) => {
    return handleRequest(request, async () => {
      return store.getCollections();
    });
  }),

  // GET /collections/:id
  http.get('/api/collections/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const collection = store.getCollectionById(params.id as string);
      if (!collection) {
        return createErrorResponse(404, 'NOT_FOUND', 'Collection not found');
      }
      return collection;
    });
  }),
];

// ============================================
// Favorites Handlers
// ============================================

export const favoritesHandlers = [
  // GET /favorites
  http.get('/api/favorites', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const favorites = store.getFavorites(user.id);
      return favorites;
    });
  }),

  // POST /favorites
  http.post('/api/favorites', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const body = await request.json() as FavoriteToggleRequest;

      const nft = store.getNFTById(body.nftId);
      if (!nft) {
        return createErrorResponse(404, 'NOT_FOUND', 'NFT not found');
      }

      // Check if already favorited
      const existing = store.getFavorite(user.id, body.nftId);
      if (existing) {
        return createErrorResponse(409, 'CONFLICT', 'Already in favorites');
      }

      const favorite: Favorite = {
        id: `fav_${Date.now()}`,
        userId: user.id,
        nftId: body.nftId,
        nft,
        createdAt: new Date().toISOString(),
      };

      store.addFavorite(favorite);

      // Update NFT favorite count
      store.updateNFT(body.nftId, {
        stats: { ...nft.stats, favorites: nft.stats.favorites + 1 },
      });

      return favorite;
    });
  }),

  // DELETE /favorites/:nftId
  http.delete('/api/favorites/:nftId', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const nftId = params.nftId as string;

      const favorite = store.getFavorite(user.id, nftId);
      if (!favorite) {
        return createErrorResponse(404, 'NOT_FOUND', 'Favorite not found');
      }

      const nft = store.getNFTById(nftId);
      store.removeFavorite(user.id, nftId);

      if (nft) {
        store.updateNFT(nftId, {
          stats: { ...nft.stats, favorites: Math.max(0, nft.stats.favorites - 1) },
        });
      }

      return { success: true };
    });
  }),
];

// ============================================
// Cart Handlers
// ============================================

export const cartHandlers = [
  // GET /cart
  http.get('/api/cart', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const cart = store.getCart(user?.id);
      return cart;
    });
  }),

  // POST /cart/items
  http.post('/api/cart/items', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const body = await request.json() as AddToCartRequest;

      const nft = store.getNFTById(body.nftId);
      if (!nft) {
        return createErrorResponse(404, 'NOT_FOUND', 'NFT not found');
      }

      if (nft.status !== 'available') {
        return createErrorResponse(409, 'CONFLICT', 'NFT is not available for purchase');
      }

      if (body.quantity > nft.edition.available) {
        return createErrorResponse(409, 'CONFLICT', `Only ${nft.edition.available} items available`);
      }

      const cartItem: CartItem = {
        id: `cart_item_${Date.now()}`,
        nftId: nft.id,
        nft,
        quantity: body.quantity,
        unitPrice: nft.price.amount,
        totalPrice: (parseFloat(nft.price.amount) * body.quantity).toFixed(4),
        addedAt: new Date().toISOString(),
      };

      store.addCartItem(user?.id, undefined, cartItem);
      const cart = store.getCart(user?.id);

      return cart;
    });
  }),

  // PATCH /cart/items/:itemId
  http.patch('/api/cart/items/:itemId', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const body = await request.json() as UpdateCartItemRequest;
      const itemId = params.itemId as string;

      const cart = store.getCart(user?.id);
      const item = cart.items.find(i => i.id === itemId);
      if (!item) {
        return createErrorResponse(404, 'NOT_FOUND', 'Cart item not found');
      }

      const nft = store.getNFTById(item.nftId);
      if (!nft) {
        return createErrorResponse(404, 'NOT_FOUND', 'NFT not found');
      }

      if (body.quantity > nft.edition.available) {
        return createErrorResponse(409, 'CONFLICT', `Only ${nft.edition.available} items available`);
      }

      store.updateCartItemQuantity(user?.id, undefined, itemId, body.quantity);
      const updatedCart = store.getCart(user?.id);

      return updatedCart;
    });
  }),

  // DELETE /cart/items/:itemId
  http.delete('/api/cart/items/:itemId', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const itemId = params.itemId as string;
      store.removeCartItem(user?.id, undefined, itemId);
      const cart = store.getCart(user?.id);

      return cart;
    });
  }),

  // POST /cart/coupon
  http.post('/api/cart/coupon', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const body = await request.json() as ApplyCouponRequest;
      const cart = store.getCart(user?.id);

      const validation = store.validateCoupon(body.code, cart.subtotal);
      if (!validation.valid) {
        return createErrorResponse(422, 'VALIDATION_ERROR', validation.error || 'Invalid coupon');
      }

      const result = store.applyCouponToCart(user?.id, undefined, body.code);
      if (!result.success) {
        return createErrorResponse(422, 'VALIDATION_ERROR', result.error ?? 'Invalid coupon');
      }

      return result.cart;
    });
  }),

  // DELETE /cart/coupon
  http.delete('/api/cart/coupon', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      store.removeCouponFromCart(user?.id, undefined);
      const cart = store.getCart(user?.id);

      return cart;
    });
  }),

  // DELETE /cart
  http.delete('/api/cart', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      const user = authResult instanceof HttpResponse ? null : authResult as User;

      const key = user?.id || 'guest_default';
      if (store.getState().carts[key]) {
        store.getState().carts[key] = {
          ...store.getState().carts[key],
          items: [],
          subtotal: '0',
          itemCount: 0,
          discount: '0',
          networkFee: '0.002',
          total: '0.002',
          updatedAt: new Date().toISOString(),
        };
        store.persist();
      }

      return store.getCart(user?.id);
    });
  }),
];

// ============================================
// Quote Handlers
// ============================================

export const quoteHandlers = [
  // POST /quotes
  http.post('/api/quotes', async ({ request }) => {
    return handleRequest(request, async () => {
      requireAuth(request);

      const body = await request.json() as QuoteRequest;

      if (!body.items || body.items.length === 0) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'No items in quote request');
      }

      const quoteItems: QuoteItemResponse[] = [];
      let subtotal = 0;
      const warnings: any[] = [];

      for (const item of body.items) {
        const nft = store.getNFTById(item.nftId);
        if (!nft) {
          return createErrorResponse(404, 'NOT_FOUND', `NFT ${item.nftId} not found`);
        }

        const available = nft.status === 'available' && nft.edition.available >= item.quantity;
        const priceChanged = false; // In real app, compare with cached price

        if (!available) {
          warnings.push({
            type: 'availability_changed',
            message: `${nft.name} is no longer available in requested quantity`,
            nftId: nft.id,
          });
        }

        const unitPrice = nft.price.amount;
        const totalPrice = (parseFloat(unitPrice) * item.quantity).toFixed(4);

        quoteItems.push({
          nftId: nft.id,
          nft,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          available,
          priceChanged,
        });

        subtotal += parseFloat(totalPrice);
      }

      let discount = '0';
      if (body.couponCode) {
        const validation = store.validateCoupon(body.couponCode, subtotal.toFixed(4));
        if (validation.valid) {
          discount = validation.coupon!.discount;
        } else {
          warnings.push({
            type: 'coupon_expired',
            message: validation.error || 'Coupon is invalid',
          });
        }
      }

      const networkFee = 0.002;
      const total = subtotal - parseFloat(discount) + networkFee;

      const quoteResponse: QuoteResponse = {
        quoteId: `quote_${Date.now()}`,
        items: quoteItems,
        subtotal: subtotal.toFixed(4),
        discount,
        networkFee: networkFee.toFixed(4),
        total: total.toFixed(4),
        currency: 'ETH',
        exchangeRate: 2400,
        validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      return quoteResponse;
    });
  }),
];

// ============================================
// Order Handlers
// ============================================

export const orderHandlers = [
  // POST /orders
  http.post('/api/orders', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const body = await request.json() as CreateOrderRequest;

      // Check idempotency key
      const existingOrder = store.getOrderByIdempotencyKey(body.idempotencyKey);
      if (existingOrder) {
        // Return existing order if same content
        const isSameContent = JSON.stringify(existingOrder.items) === JSON.stringify(body.quoteId); // Simplified
        if (isSameContent) {
          return existingOrder;
        }
        return createErrorResponse(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key reused with different content');
      }

      // Get quote (in real app, you'd validate the quote)
      // For mock, we'll create a basic order
      const cart = store.getCart(user.id);
      if (cart.items.length === 0) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Cart is empty');
      }

      // Validate wallet
      const wallet = store.getWallets(user.id).find(w => w.address === body.walletAddress && w.network === body.network);
      if (!wallet) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Invalid wallet for selected network');
      }

      // Create order
      const order: Order = {
        id: `order_${Date.now()}`,
        idempotencyKey: body.idempotencyKey,
        userId: user.id,
        type: 'purchase',
        status: 'pending',
        items: cart.items.map(item => ({
          nftId: item.nftId,
          nft: item.nft,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        quote: {
          quoteId: body.quoteId,
          items: cart.items.map(item => ({
            nftId: item.nftId,
            nft: item.nft,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            available: true,
            priceChanged: false,
          })),
          subtotal: cart.subtotal,
          discount: cart.discount,
          networkFee: cart.networkFee,
          total: cart.total,
          currency: 'ETH',
          exchangeRate: 2400,
          validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        payment: {
          walletAddress: body.walletAddress,
          network: body.network,
          chainId: store.getNetwork(body.network)?.chainId || 1,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      store.createOrder(order);

      // Clear cart after successful order
      const cartKey = user.id;
      if (store.getState().carts[cartKey]) {
        store.getState().carts[cartKey] = {
          ...store.getState().carts[cartKey],
          items: [],
          subtotal: '0',
          itemCount: 0,
          discount: '0',
          networkFee: '0.002',
          total: '0.002',
          updatedAt: new Date().toISOString(),
        };
        store.persist();
      }

      // Simulate async confirmation
      setTimeout(() => {
        // Randomly confirm or reject for demo
        const confirmed = Math.random() > 0.3;
        store.updateOrder(order.id, {
          status: confirmed ? 'confirmed' : 'rejected',
          transactionHash: confirmed ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined,
          blockNumber: confirmed ? 18500000 + Math.floor(Math.random() * 1000) : undefined,
          explorerUrl: confirmed ? `https://etherscan.io/tx/0x${Math.random().toString(16).substring(2, 66)}` : undefined,
          failureReason: confirmed ? undefined : 'Transaction rejected by network',
          confirmedAt: confirmed ? new Date().toISOString() : undefined,
        });
      }, 3000);

      return order;
    });
  }),

  // GET /orders
  http.get('/api/orders', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const orders = store.getOrders(user.id);
      return orders;
    });
  }),

  // GET /orders/:id
  http.get('/api/orders/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const order = store.getOrderById(params.id as string);
      if (!order) {
        return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
      }

      const authResult2 = requireAuth(request);
      const user = authResult2 instanceof HttpResponse ? null : authResult2 as User;
      if (user && order.userId !== user.id) {
        return createErrorResponse(403, 'FORBIDDEN', 'Not authorized to view this order');
      }

      return order;
    });
  }),
];

// ============================================
// Profile Handlers
// ============================================

export const profileHandlers = [
  // GET /profile
  http.get('/api/profile', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      return user;
    });
  }),

  // PATCH /profile
  http.patch('/api/profile', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const body = await request.json() as UpdateProfileRequest;

      // Username must be unique across collectors
      if (body.username) {
        const taken = store.getState().users.find(
          (u) => u.id !== user.id && u.username?.toLowerCase() === body.username!.toLowerCase()
        );
        if (taken) {
          return createErrorResponse(409, 'CONFLICT', 'Username already taken', {
            username: ['Este nome de usuário já está em uso'],
          });
        }
      }

      const updatedUser = store.updateUser(user.id, body);
      if (!updatedUser) {
        return createErrorResponse(404, 'NOT_FOUND', 'User not found');
      }

      return updatedUser;
    });
  }),

  // POST /profile/avatar
  http.post('/api/profile/avatar', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      // In real app, handle file upload
      // For mock, just return a new avatar URL
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}_${Date.now()}`;

      const updatedUser = store.updateUser(user.id, { avatarUrl });
      return { avatarUrl: updatedUser?.avatarUrl };
    });
  }),
];

// ============================================
// Wallet Handlers
// ============================================

export const walletHandlers = [
  // GET /wallets
  http.get('/api/wallets', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      return store.getWallets(user.id);
    });
  }),

  // POST /wallets
  http.post('/api/wallets', async ({ request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const body = await request.json() as AddWalletRequest;

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Invalid Ethereum address', {
          address: ['Invalid Ethereum address format'],
        });
      }

      // Check if wallet already exists for user
      const existing = store.getWallets(user.id).find(w => w.address.toLowerCase() === body.address.toLowerCase());
      if (existing) {
        return createErrorResponse(409, 'CONFLICT', 'Wallet already added');
      }

      // Check primary wallet limit
      if (body.type === 'primary') {
        const hasPrimary = store.getWallets(user.id).some(w => w.type === 'primary');
        if (hasPrimary) {
          return createErrorResponse(422, 'VALIDATION_ERROR', 'Primary wallet already exists');
        }
      }

      const network = store.getNetwork(body.network);
      if (!network) {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Invalid network');
      }

      const wallet: Wallet = {
        id: `wallet_${Date.now()}`,
        userId: user.id,
        type: body.type,
        address: body.address,
        network: body.network,
        chainId: body.chainId,
        name: body.name,
        provider: body.provider,
        displayName: body.displayName,
        profileName: body.profileName,
        email: body.email,
        referralCode: body.referralCode,
        ensName: body.ensName,
        ensDomain: body.ensDomain,
        linkedAddress: body.linkedAddress || undefined,
        isConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.createWallet(wallet);
      return wallet;
    });
  }),

  // PATCH /wallets/:id
  http.patch('/api/wallets/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const walletId = params.id as string;
      const body = await request.json() as UpdateWalletRequest;

      const wallet = store.getWalletById(walletId);
      if (!wallet || wallet.userId !== user.id) {
        return createErrorResponse(404, 'NOT_FOUND', 'Wallet not found');
      }

      const updatedWallet = store.updateWallet(walletId, body);
      return updatedWallet;
    });
  }),

  // DELETE /wallets/:id
  http.delete('/api/wallets/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const authResult = requireAuth(request);
      if (authResult instanceof HttpResponse) return authResult;

      const user = authResult as User;
      const walletId = params.id as string;

      const wallet = store.getWalletById(walletId);
      if (!wallet || wallet.userId !== user.id) {
        return createErrorResponse(404, 'NOT_FOUND', 'Wallet not found');
      }

      if (wallet.type === 'primary') {
        return createErrorResponse(422, 'VALIDATION_ERROR', 'Cannot delete primary wallet');
      }

      store.deleteWallet(walletId);
      return { success: true };
    });
  }),
];

// ============================================
// Network Handlers
// ============================================

export const networkHandlers = [
  http.get('/api/networks', async ({ request }) => {
    return handleRequest(request, async () => {
      return store.getNetworks();
    });
  }),

  http.get('/api/networks/:id', async ({ params, request }) => {
    return handleRequest(request, async () => {
      const network = store.getNetwork(params.id as string);
      if (!network) {
        return createErrorResponse(404, 'NOT_FOUND', 'Network not found');
      }
      return network;
    });
  }),
];

// ============================================
// Admin/Testing Handlers
// ============================================

export const adminHandlers = [
  // POST /admin/reset
  http.post('/api/admin/reset', async ({ request }) => {
    return handleRequest(request, async () => {
      const body = await request.json() as { scenario?: string } | undefined;
      const scenario = body?.scenario || 'full';
      resetStoreToScenario(scenario as any);
      return { success: true, scenario };
    });
  }),

  // POST /admin/error-scenario
  http.post('/api/admin/error-scenario', async ({ request }) => {
    return handleRequest(request, async () => {
      const body = await request.json() as Partial<ErrorScenario>;
      setErrorScenario(body);
      return { success: true, scenario: body };
    });
  }),

  // GET /admin/state
  http.get('/api/admin/state', async ({ request }) => {
    return handleRequest(request, async () => {
      return store.getState();
    });
  }),
];

// ============================================
// All Handlers Combined
// ============================================

export const allHandlers = [
  ...authHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...networkHandlers,
  ...adminHandlers,
];