import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <main id="conteudo" className="relative grid min-h-dvh place-items-center overflow-hidden bg-surface p-6">
      {/* Faixa vermelha no topo, estilo app de delivery; o card fica por cima */}
      <div className="absolute inset-x-0 top-0 h-[45dvh] rounded-b-[48px] bg-header" aria-hidden />
      <Card className="relative w-full max-w-sm p-8 shadow-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-md bg-primary font-display text-xl font-extrabold text-primary-foreground">
            pg
          </span>
          <h1 className="font-display text-2xl font-bold">Portal do Parceiro</h1>
          <p className="text-sm text-foreground-secondary">Entre para gerenciar sua loja</p>
        </div>
        {/* Server Action → POST /api/auth/login (BFF) define o cookie HttpOnly */}
        <form className="space-y-4" action="/api/auth/login" method="post">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" required
              className="h-11 w-full rounded-sm border border-border bg-background px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-ring" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required
              className="h-11 w-full rounded-sm border border-border bg-background px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-ring" />
          </div>
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </Card>
    </main>
  );
}
