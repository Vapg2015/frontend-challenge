/**
 * Main Layout
 * Wrapper for main application pages with sidebar on desktop
 */

import { Outlet } from '@tanstack/react-router';

export function MainLayout() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Outlet />
    </div>
  );
}