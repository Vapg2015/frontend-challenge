/**
 * Application Entry Point
 * Sets up providers, routing, and starts MSW in development
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import './index.css';
import { router } from './router';
import { queryClient } from './api/queryClient';

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/router-devtools').then((m) => ({ default: m.TanStackRouterDevtools })),
    )
  : () => null;

// ============================================
// Start MSW in Development
// ============================================

async function enableMocking() {
  if (import.meta.env.VITE_MOCK_API !== 'true') return;
  const { startMSW } = await import('./mocks/browser');
  await startMSW({ quiet: true });
}

// ============================================
// Root Component
// ============================================

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Suspense fallback={null}>
        <RouterDevtools router={router} />
      </Suspense>
    </QueryClientProvider>
  );
}

// ============================================
// Render
// ============================================

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
});