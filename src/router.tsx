/**
 * TanStack Router configuration (code-based routing)
 * Routes, typed/validated search params, lazy components and private-route guards.
 */

import {
  createRouter,
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { getAccessToken } from './api/axios';
import { RootLayout } from './components/layout/RootLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { AccountLayout } from './components/layout/AccountLayout';
import type { NFTSortField, NFTStatus, SortOrder } from './api/contracts';

// ============================================
// Search param validation (URL is the source of truth)
// ============================================

export interface HomeSearch {
  search?: string;
  collection?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: NFTStatus;
  sortBy?: NFTSortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

const STATUSES: NFTStatus[] = ['available', 'reserved', 'sold', 'hidden'];
const SORT_FIELDS: NFTSortField[] = ['price', 'createdAt', 'name', 'popularity'];
const SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined =>
  list.includes(v as T) ? (v as T) : undefined;
const positiveInt = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseInt(v, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export function validateHomeSearch(raw: Record<string, unknown>): HomeSearch {
  const result: HomeSearch = {
    search: str(raw.search),
    collection: str(raw.collection),
    minPrice: str(raw.minPrice),
    maxPrice: str(raw.maxPrice),
    status: oneOf(raw.status, STATUSES),
    sortBy: oneOf(raw.sortBy, SORT_FIELDS),
    sortOrder: oneOf(raw.sortOrder, SORT_ORDERS),
    page: positiveInt(raw.page),
    pageSize: positiveInt(raw.pageSize),
  };
  // Keep the URL clean: drop undefined keys
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v !== undefined)) as HomeSearch;
}

/** Only same-origin absolute paths are accepted as redirect targets (no open redirect). */
const safeRedirect = (v: unknown): string | undefined =>
  typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : undefined;

// ============================================
// Root + public routes
// ============================================

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'home',
  component: lazyRouteComponent(() => import('./pages/Home'), 'HomePage'),
  validateSearch: validateHomeSearch,
});

const indexRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/',
});

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  component: lazyRouteComponent(() => import('./pages/NFTDetail'), 'NFTDetailPage'),
  validateSearch: (raw: Record<string, unknown>): { tab?: string } => ({ tab: str(raw.tab) }),
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: lazyRouteComponent(() => import('./pages/Cart'), 'CartPage'),
});

// ============================================
// Private routes (checkout, confirmation, account)
// ============================================

/** Redirects to login keeping the original location, so the flow can be resumed. */
function requireSession({ location }: { location: { href: string } }) {
  if (!getAccessToken()) {
    throw redirect({ to: '/auth/login', search: { redirect: location.href } });
  }
}

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireSession,
  component: lazyRouteComponent(() => import('./pages/Checkout'), 'CheckoutPage'),
});

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$id',
  beforeLoad: requireSession,
  component: lazyRouteComponent(() => import('./pages/OrderConfirmation'), 'OrderConfirmationPage'),
});

const accountLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  beforeLoad: requireSession,
  component: AccountLayout,
});

const accountIndexRoute = createRoute({
  getParentRoute: () => accountLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/account/profile' });
  },
});

const profileRoute = createRoute({
  getParentRoute: () => accountLayoutRoute,
  path: '/profile',
  component: lazyRouteComponent(() => import('./pages/Profile'), 'ProfilePage'),
});

const walletsRoute = createRoute({
  getParentRoute: () => accountLayoutRoute,
  path: '/wallets',
  component: lazyRouteComponent(() => import('./pages/Wallets'), 'WalletsPage'),
});

// ============================================
// Auth routes
// ============================================

const authLayoutRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/auth',
  component: AuthLayout,
});

const authIndexRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/auth/login' });
  },
});

const redirectSearch = (raw: Record<string, unknown>): { redirect?: string } => ({
  redirect: safeRedirect(raw.redirect),
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  validateSearch: redirectSearch,
  component: lazyRouteComponent(() => import('./pages/Login'), 'LoginPage'),
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  validateSearch: redirectSearch,
  component: lazyRouteComponent(() => import('./pages/Register'), 'RegisterPage'),
});

// ============================================
// Not found
// ============================================

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$',
  component: lazyRouteComponent(() => import('./pages/NotFound'), 'NotFoundPage'),
});

// ============================================
// Route tree + router
// ============================================

const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    indexRoute,
    authLayoutRoute.addChildren([authIndexRoute, loginRoute, registerRoute]),
  ]),
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderConfirmationRoute,
  accountLayoutRoute.addChildren([accountIndexRoute, profileRoute, walletsRoute]),
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: lazyRouteComponent(() => import('./pages/NotFound'), 'NotFoundPage'),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}