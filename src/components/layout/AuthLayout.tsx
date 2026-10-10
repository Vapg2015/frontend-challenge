/**
 * Auth Layout
 * Modal-style card for login/register pages (Figma)
 */

import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname.includes('/register');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm overflow-y-auto">
      <section
        aria-label={isRegister ? 'Criar conta' : 'Entrar'}
        className="relative w-full max-w-sm bg-surface-card border-b-8 border-amber shadow-2xl"
      >
        <Link
          to="/"
          aria-label="Fechar"
          className="absolute top-3 right-3 text-primary-dark hover:text-amber transition-colors"
        >
          <X className="h-4 w-4" />
        </Link>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-0 pt-8 pb-4 text-sm font-medium">
          <Link
            to="/auth/login"
            className={cn(
              'pr-3 border-r border-amber transition-colors',
              !isRegister ? 'text-amber' : 'text-text-primary hover:text-amber'
            )}
          >
            Entrar
          </Link>
          <Link
            to="/auth/register"
            className={cn(
              'pl-3 transition-colors',
              isRegister ? 'text-amber' : 'text-text-primary hover:text-amber'
            )}
          >
            Criar conta
          </Link>
        </div>

        <div className="px-8 pb-6">
          <Outlet />
        </div>

        {/* Social */}
        <div className="border-t border-border-soft px-8 pt-3 pb-6 text-center">
          <p className="text-[10px] text-text-primary mb-3">Ou continue com</p>
          <div className="space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 h-8 border border-border text-[10px] text-text-primary hover:border-amber transition-colors"
            >
              <span className="font-bold text-google-blue text-xs">G</span>
              Continuar com Google
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 h-8 border border-border text-[10px] text-text-primary hover:border-amber transition-colors"
            >
              <span className="font-bold text-facebook text-xs">f</span>
              Continuar com Facebook
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}