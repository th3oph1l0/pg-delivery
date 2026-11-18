'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton } from '@/components/ui/primitives';
import { useActiveOrders, useMerchantRealtime } from '@/features/orders/hooks';
import { OrderCard } from '@/features/orders/order-card';
import { COLUMNS } from '@/features/orders/types';

export default function OrdersPage() {
  useMerchantRealtime();
  const { data, isLoading, isFetching, refetch } = useActiveOrders();

  return (
    <section aria-labelledby="titulo-pedidos">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 id="titulo-pedidos" className="font-display text-2xl font-bold">
            Pedidos
          </h1>
          <p className="text-sm text-foreground-secondary">Atualiza em tempo real. Aceite novos pedidos em até 8 minutos.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching && !isLoading}>
          <RefreshCw aria-hidden /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const orders = (data ?? []).filter((o) => col.status.includes(o.status));
          return (
            <div key={col.title} className="flex min-h-[60dvh] flex-col rounded-lg bg-muted/60 p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                {col.title}
                <Badge tone={col.tone} aria-label={`${orders.length} pedidos`}>
                  {isLoading ? '…' : orders.length}
                </Badge>
              </h2>
              <div className="flex flex-col gap-3" aria-live="polite" aria-busy={isLoading}>
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)
                  : orders.map((o) => <OrderCard key={o.id} order={o} />)}
                {!isLoading && orders.length === 0 && (
                  <p className="px-1 py-8 text-center text-[13px] text-foreground-tertiary">Nenhum pedido aqui</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
