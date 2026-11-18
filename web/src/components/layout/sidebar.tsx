'use client';

import { BarChart3, LayoutDashboard, Megaphone, ReceiptText, Settings, UtensilsCrossed, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/orders', label: 'Pedidos', icon: ReceiptText },
  { href: '/menu', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/promotions', label: 'Promoções', icon: Megaphone },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/financial', label: 'Financeiro', icon: Wallet },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
      {/* Continua a faixa vermelha da Topbar (mesma altura: h-16) */}
      <Link
        href="/dashboard"
        className="-mx-4 -mt-4 mb-6 flex h-16 shrink-0 items-center gap-2 bg-header px-6 text-header-foreground shadow-md focus-visible:outline-white"
        aria-label="PG Delivery, início"
      >
        <span className="grid size-9 place-items-center rounded-md bg-white font-display text-lg font-extrabold text-[#d91a27]">
          pg
        </span>
        <span className="font-display text-[17px] font-bold leading-tight">
          Pequeno Gigante
          <span className="block text-[11px] font-semibold uppercase tracking-[0.08em]">Parceiros</span>
        </span>
      </Link>
      <nav aria-label="Principal">
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground',
                    active && 'bg-primary-container font-semibold text-primary hover:bg-primary-container hover:text-primary',
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
