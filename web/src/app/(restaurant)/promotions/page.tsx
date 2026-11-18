'use client';

import { Plus, TicketPercent } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, Skeleton } from '@/components/ui/primitives';
import { usePromotions } from '@/features/promotions/hooks';
import { PromotionCard } from '@/features/promotions/promotion-card';
import { PromotionForm } from '@/features/promotions/promotion-form';
import { promotionStatus, STATUS_META, type PromotionStatus } from '@/features/promotions/types';
import { cn, formatBRL } from '@/lib/utils';

type Filter = 'ALL' | PromotionStatus;
const FILTERS: Filter[] = ['ALL', 'ACTIVE', 'SCHEDULED', 'PAUSED', 'ENDED'];
const ORDER: Record<PromotionStatus, number> = { ACTIVE: 0, SCHEDULED: 1, PAUSED: 2, ENDED: 3 };

export default function PromotionsPage() {
  const { data, isLoading } = usePromotions();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showForm, setShowForm] = useState(false);

  const withStatus = useMemo(
    () =>
      (data ?? [])
        .map((p) => ({ p, status: promotionStatus(p) }))
        .sort((a, b) => ORDER[a.status] - ORDER[b.status]),
    [data],
  );
  const count = (f: Filter) => (f === 'ALL' ? withStatus.length : withStatus.filter((x) => x.status === f).length);
  const visible = filter === 'ALL' ? withStatus : withStatus.filter((x) => x.status === filter);

  const kpis = [
    { label: 'Promoções ativas', value: String(count('ACTIVE')) },
    { label: 'Usos no total', value: String(withStatus.reduce((s, x) => s + x.p.redemptions, 0)) },
    { label: 'Descontos concedidos', value: formatBRL(withStatus.reduce((s, x) => s + x.p.discountGivenCents, 0)) },
  ];

  return (
    <section aria-labelledby="titulo-promocoes" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="titulo-promocoes" className="font-display text-2xl font-bold">Promoções</h1>
          <p className="text-sm text-foreground-secondary">Cupons de desconto e frete grátis da sua loja.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus aria-hidden /> Nova promoção
          </Button>
        )}
      </div>

      {showForm && <PromotionForm onClose={() => setShowForm(false)} />}

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
          : kpis.map((k) => (
              <Card key={k.label} className="p-5">
                <p className="text-[13px] font-medium text-foreground-secondary">{k.label}</p>
                <p className="mt-1 font-display text-[28px] font-extrabold leading-9">{k.value}</p>
              </Card>
            ))}
      </div>

      <div role="tablist" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'h-9 rounded-full border border-border px-4 text-sm font-medium text-foreground-secondary transition-colors hover:bg-muted',
              filter === f && 'border-primary bg-primary-container font-semibold text-primary hover:bg-primary-container',
            )}
          >
            {f === 'ALL' ? 'Todas' : STATUS_META[f].label}
            <span className="ml-1.5 text-xs opacity-70">{isLoading ? '…' : count(f)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={isLoading}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-md" />)
          : visible.map(({ p }) => <PromotionCard key={p.id} promotion={p} />)}
      </div>

      {!isLoading && visible.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center text-foreground-secondary">
          <TicketPercent className="size-8" aria-hidden />
          <p>Nenhuma promoção {filter === 'ALL' ? 'cadastrada' : `com situação "${STATUS_META[filter].label.toLowerCase()}"`}.</p>
          {filter === 'ALL' && !showForm && (
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
              <Plus aria-hidden /> Criar a primeira
            </Button>
          )}
        </Card>
      )}
    </section>
  );
}
