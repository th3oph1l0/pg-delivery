'use client';

import { Bike, Check, ChefHat, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/primitives';
import { cn, formatBRL, minutesSince } from '@/lib/utils';
import { useOrderAction } from './hooks';
import type { MerchantOrder } from './types';

export function OrderCard({ order }: { order: MerchantOrder }) {
  const action = useOrderAction();
  const waiting = minutesSince(order.createdAt);
  const late = order.status === 'PLACED' && waiting >= 3;
  const busy = action.isPending && action.variables?.orderId === order.id;

  return (
    <Card
      className={cn('p-4 transition-shadow duration-200 hover:shadow-md', late && 'ring-2 ring-primary')}
      aria-label={`Pedido ${order.code} de ${order.customer.name}`}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className="font-display text-[15px] font-bold">{order.code}</span>
        <Badge tone={late ? 'danger' : 'neutral'}>
          <Clock className="size-3" aria-hidden />
          <span>{waiting} min</span>
        </Badge>
      </header>

      <p className="mb-2 text-[13px] text-foreground-secondary">{order.customer.name}</p>

      <ul className="mb-3 space-y-1 text-sm">
        {order.items.map((it, i) => (
          <li key={i}>
            <span className="font-semibold">{it.quantity}×</span> {it.productName}
            {it.options.length > 0 && (
              <span className="block pl-5 text-[13px] text-foreground-secondary">{it.options.map((o) => o.name).join(' · ')}</span>
            )}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mb-3 rounded-sm bg-accent/25 px-2 py-1 text-[13px]">📝 {order.notes}</p>}

      <footer className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">{formatBRL(order.totalCents)}</span>

        {order.status === 'PLACED' && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Recusar pedido ${order.code}`}
              disabled={busy}
              onClick={() => action.mutate({ orderId: order.id, action: { kind: 'reject', reason: 'store_busy' } })}
            >
              <X aria-hidden />
            </Button>
            <Button
              size="sm"
              loading={busy}
              onClick={() => action.mutate({ orderId: order.id, action: { kind: 'accept', prepMinutes: 15 } })}
            >
              <Check aria-hidden /> Aceitar
            </Button>
          </div>
        )}
        {(order.status === 'CONFIRMED' || order.status === 'PREPARING') && (
          <Button
            variant="success"
            size="sm"
            loading={busy}
            onClick={() => action.mutate({ orderId: order.id, action: { kind: 'ready' } })}
          >
            <ChefHat aria-hidden /> Pronto
          </Button>
        )}
        {order.status === 'READY_FOR_PICKUP' && <Badge tone="success">Aguardando entregador</Badge>}
        {order.status === 'PICKED_UP' && order.courier && (
          <Badge tone="info">
            <Bike className="size-3" aria-hidden /> {order.courier.name}
          </Badge>
        )}
      </footer>
    </Card>
  );
}
