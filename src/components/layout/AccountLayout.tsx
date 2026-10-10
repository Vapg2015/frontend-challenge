/**
 * Account Layout
 * Sidebar navigation for account pages
 */

import { Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { cn } from '@/utils/cn';
import {
  User, MapPin, ShoppingCart, Heart, TrendingUp, Download, TriangleAlert, LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type NavItem = {
  name: string;
  icon: LucideIcon;
  /** Only routes that exist are linkable; the others are visual placeholders. */
  href?: '/account/profile' | '/account/wallets';
};

const navigation: NavItem[] = [
  { name: 'Dados do perfil', href: '/account/profile', icon: User },
  { name: 'Carteiras', href: '/account/wallets', icon: MapPin },
  { name: 'Atividade', icon: ShoppingCart },
  { name: 'Lista de interesse', icon: Heart },
  { name: 'Ofertas', icon: TrendingUp },
  { name: 'Arquivos baixados', icon: Download },
  { name: 'Suporte', icon: TriangleAlert },
];

export function AccountLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/' });
  };

  const itemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors border-l-4',
      isActive
        ? 'border-amber text-amber bg-surface-raised/40'
        : 'border-transparent text-amber hover:bg-surface-raised/60'
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-surface-card">
            <h2 className="px-3 py-2 text-sm font-bold text-text-primary">Meu perfil</h2>

            <nav aria-label="Navegação da conta">
              <ul>
                {navigation.map((item) => {
                  const isActive = !!item.href && location.pathname.startsWith(item.href);
                  const content = (
                    <>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.name}
                    </>
                  );
                  return (
                    <li key={item.name}>
                      {item.href ? (
                        <Link
                          to={item.href}
                          className={itemClass(isActive)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {content}
                        </Link>
                      ) : (
                        <span className={cn(itemClass(false), 'cursor-default')}>{content}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="border-t border-border-soft">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-amber hover:bg-surface-raised/60 transition-colors border-l-4 border-transparent"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}