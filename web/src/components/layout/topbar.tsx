'use client';

import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';

/** Botões fantasma sobre a faixa vermelha: ícone branco e foco branco (o anel vermelho sumiria no fundo). */
const onRed = 'text-header-foreground hover:bg-white/15 focus-visible:outline-white';

export function Topbar() {
  const name = useSessionStore((s) => s.restaurantName);
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(true);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 bg-header px-6 text-header-foreground shadow-md">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-[17px] font-bold">{name}</h2>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors',
            open
              ? 'border-white bg-white text-[#0e7a55]'
              : 'border-white/60 bg-white/10 text-header-foreground hover:bg-white/20',
          )}
        >
          <span className={cn('size-2 rounded-full', open ? 'bg-[#0e7a55]' : 'bg-white/70')} aria-hidden />
          {open ? 'Loja aberta' : 'Loja fechada'}
        </button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={onRed}
          aria-label={resolvedTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
        <Button variant="ghost" size="icon" className={onRed} aria-label="Notificações">
          <Bell aria-hidden />
        </Button>
      </div>
    </header>
  );
}
