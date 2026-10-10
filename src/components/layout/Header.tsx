/**
 * Header Component
 * Navigation, search, cart, user menu
 */

import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Menu, X, Search, ShoppingCart, User, Wallet, LogOut
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const urlSearch = useRouterState({
    select: (s) => (s.location.pathname === '/' ? ((s.location.search as { search?: string }).search ?? '') : ''),
  });
  const [draft, setDraft] = useState<string | null>(null);
  const search = draft ?? urlSearch;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: '/', search: { search: search.trim() || undefined } });
    setDraft(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="Kurio Home">
            <span className="text-xl font-bold tracking-widest text-text-primary">KURIO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-amber border-b-2 border-amber pb-1" activeProps={{ className: "text-amber border-b-2 border-amber" }}>
              Início
            </Link>
            <a href="/#mercado" className="text-sm font-medium text-text-primary hover:text-amber transition-colors pb-1 border-b-2 border-transparent">
              Mercado
            </a>
            <a href="/#criadores" className="text-sm font-medium text-text-primary hover:text-amber transition-colors pb-1 border-b-2 border-transparent">
              Criadores
            </a>
            <a href="/#aprenda" className="text-sm font-medium text-text-primary hover:text-amber transition-colors pb-1 border-b-2 border-transparent">
              Aprenda
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {/* Search Button */}
            <button
              className="text-text-primary hover:text-amber transition-colors"
              onClick={() => { /* open search modal later */ }}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative text-text-primary hover:text-amber transition-colors" aria-label="Shopping Cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-ink">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu / Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0 hover:bg-surface-raised" aria-label="User menu">
                    <Avatar className="h-9 w-9 border border-border-soft">
                      <AvatarImage src={user?.avatarUrl} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-ink-soft text-text-primary">{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-card border-border-soft text-text-primary">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border-soft" />
                  <DropdownMenuItem asChild className="hover:bg-surface-raised focus:bg-surface-raised cursor-pointer">
                    <a href="/account/profile" className="flex w-full items-center justify-between">
                      <User className="mr-2 h-4 w-4" />
                      Meu perfil
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-surface-raised focus:bg-surface-raised cursor-pointer">
                    <a href="/account/wallets" className="flex w-full items-center justify-between">
                      <Wallet className="mr-2 h-4 w-4" />
                      Carteiras
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-soft" />
                  <DropdownMenuItem onClick={handleLogout} className="text-error focus:text-error hover:bg-surface-raised focus:bg-surface-raised cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/auth/login" search={{ redirect: '/' }}>
                  <Button className="bg-amber hover:bg-amber/90 text-ink font-bold h-9 px-6 rounded text-sm transition-colors">
                    Entrar
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-down">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search NFTs, collections..."
                  value={search}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Discover
              </Link>
              <a href="/#collections" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Collections
              </a>
              <a href="/#rankings" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Rankings
              </a>
              <a href="/favorites" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Favorites
              </a>
              {isAuthenticated ? (
                <>
                  <Link to="/account/profile" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/account/wallets" className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Wallets
                  </Link>
                  <button onClick={handleLogout} className="px-3 py-2 text-left text-error hover:bg-background rounded-lg transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Link to="/auth/login" search={{ redirect: '/' }} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/auth/register" search={{ redirect: '/' }} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}