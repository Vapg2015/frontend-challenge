/**
 * Not Found Page
 * 404 page for unknown routes
 */

import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-text-primary">Page Not Found</h2>
        <p className="mt-2 text-text-secondary">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg">
              <Search className="mr-2 h-4 w-4" />
              Browse NFTs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}