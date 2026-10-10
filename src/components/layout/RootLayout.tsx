/**
 * Root Layout
 * Router-aware providers (auth/cart/favorites need router hooks) + shell
 */

import { Link, Outlet } from '@tanstack/react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from '@/components/ui/toaster';
import { ToastProviderComponent } from '@/hooks/useToast';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { FavoritesProvider } from '@/hooks/useFavorites';

export function RootLayout() {
  return (
    <ToastProviderComponent>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <div className="flex flex-col min-h-screen">
              <Link
                to="/"
                hash="main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3"
              >
                Skip to content
              </Link>
              <Header />
              <main id="main-content" className="flex-1" tabIndex={-1}>
                <Outlet />
              </main>
              <Footer />
              <Toaster />
            </div>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProviderComponent>
  );
}