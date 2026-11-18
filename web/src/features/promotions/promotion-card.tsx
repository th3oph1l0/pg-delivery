'use client';

import { CalendarDays, Pause, Play, Ticket, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/primitives';
import { cn, formatBRL } from '@/lib/utils';
import { useTogglePromotion } from './hooks';
import { promotionStatus, STATUS_META, TYPE_LABEL, type Promotion } from './types';

const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

/** "10% off", "R$ 15 off" ou "Frete grátis". */
export function benefitLabel(p: Pick<Promotion, 'type' | 'value'>) {
  if (p.type === 'PERCENT') return `${(p.value / 100).toLocaleString('pt-BR')}% off`;
  if (p.type === 'FIXED') return `${formatBRL(p.value)} off`;
  return 'Frete grátis';
}

export function PromotionCard({ promotion: p }: { promotion: Promotion }) {
  const toggle = useTogglePromotion();
  const status = promotionStatus(p);
  const meta = STATUS_META[status];
  const usagePct = p.usageLimit ? Math.min(100, (p.redemptions / p.usageLimit) * 100) : null;
  const ended = status === 'ENDED';

  const rules = [
    p.minOrderCents > 0 && `Pedido mínimo ${formatBRL(p.minOrderCents)}`,
    p.maxDiscountCents && `Desconto até ${formatBRL(p.maxDiscountCents)}`,
    p.perUserLimit > 1 ? `${p.perUserLimit} usos por cliente` : '1 uso por cliente',
    p.firstOrderOnly && 'Só primeiro pedido',
  ].filter(Boolean) as string[];

  return (
    <Card className={cn('flex flex-col gap-4 p-5', ended && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground" aria-hidden>
            {p.type === 'FREE_DELIVERY' ? <Truck className="size-5" /> : <Ticket className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[15px] font-bold tracking-wide">{p.code}</p>
            <p className="text-[13px] text-foreground-secondary">{TYPE_LABEL[p.type]}</p>
          </div>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div>
        <p className="font-display text-2xl font-extrabold text-primary">{benefitLabel(p)}</p>
        <p className="mt-0.5 text-sm">{p.description}</p>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Regras">
        {rules.map((r) => (
          <li key={r} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground-secondary">{r}</li>
        ))}
      </ul>

      <div className="space-y-1.5 text-[13px] text-foreground-secondary">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden />
          {date.format(new Date(p.startsAt))} até {date.format(new Date(p.endsAt))}
        </p>
        <p className="flex items-center gap-1.5">
          <Users className="size-4" aria-hidden />
          {p.redemptions} {p.redemptions === 1 ? 'uso' : 'usos'}
          {p.usageLimit ? ` de ${p.usageLimit}` : ''} · {formatBRL(p.discountGivenCents)} em descontos
        </p>
        {usagePct !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Uso do limite"
            aria-valuenow={Math.round(usagePct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${usagePct}%` }} />
          </div>
        )}
      </div>

      {!ended && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-auto self-start"
          loading={toggle.isPending}
          onClick={() => toggle.mutate({ id: p.id, isActive: !p.isActive })}
        >
          {p.isActive ? <><Pause aria-hidden /> Pausar</> : <><Play aria-hidden /> Reativar</>}
        </Button>
      )}
    </Card>
  );
}
