'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives';
import { useCreatePromotion } from './hooks';
import { TYPE_LABEL, type PromotionType } from './types';

const input =
  'h-11 w-full rounded-sm border border-border bg-background px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-ring';
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
/** "12,50" → 1250 */
const toCents = (v: string) => Math.round(Number(v.replace(',', '.') || 0) * 100);

/** Formulário simples de criação. Próximo passo: virar um Dialog/Sheet com validação via zod. */
export function PromotionForm({ onClose }: { onClose: () => void }) {
  const create = useCreatePromotion();
  const [type, setType] = useState<PromotionType>('PERCENT');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();

    const code = get('code').toUpperCase();
    const startsAt = new Date(`${get('startsAt')}T00:00:00`);
    const endsAt = new Date(`${get('endsAt')}T23:59:59`);
    const raw = get('value');

    if (!/^[A-Z0-9]{3,30}$/.test(code)) return setError('Código: 3 a 30 letras ou números, sem espaços.');
    if (endsAt <= startsAt) return setError('A data de fim precisa ser depois do início.');
    if (type === 'PERCENT' && !(Number(raw) > 0 && Number(raw) <= 100)) return setError('Percentual entre 1 e 100.');
    if (type === 'FIXED' && toCents(raw) <= 0) return setError('Informe o valor do desconto.');
    setError(null);

    const maxDiscount = get('maxDiscount');
    const usageLimit = get('usageLimit');
    create.mutate(
      {
        code,
        description: get('description') || code,
        type,
        value: type === 'PERCENT' ? Math.round(Number(raw.replace(',', '.')) * 100) : type === 'FIXED' ? toCents(raw) : 0,
        maxDiscountCents: type === 'PERCENT' && maxDiscount ? toCents(maxDiscount) : null,
        minOrderCents: toCents(get('minOrder')),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Math.max(1, Number(get('perUserLimit') || 1)),
        firstOrderOnly: f.get('firstOrderOnly') === 'on',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Nova promoção</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar formulário">
          <X aria-hidden />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" noValidate>
          <Field label="Código do cupom" htmlFor="code">
            <input id="code" name="code" required placeholder="EX: PEQUENO10" className={`${input} uppercase`} />
          </Field>
          <Field label="Tipo" htmlFor="type">
            <select id="type" value={type} onChange={(e) => setType(e.target.value as PromotionType)} className={input}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          {type !== 'FREE_DELIVERY' && (
            <Field label={type === 'PERCENT' ? 'Desconto (%)' : 'Desconto (R$)'} htmlFor="value">
              <input id="value" name="value" inputMode="decimal" required placeholder={type === 'PERCENT' ? '10' : '15,00'} className={input} />
            </Field>
          )}
          {type === 'PERCENT' && (
            <Field label="Desconto máximo (R$)" htmlFor="maxDiscount" hint="Opcional">
              <input id="maxDiscount" name="maxDiscount" inputMode="decimal" placeholder="20,00" className={input} />
            </Field>
          )}
          <Field label="Descrição" htmlFor="description" className="md:col-span-2">
            <input id="description" name="description" placeholder="Ex: 10% em qualquer pedido acima de R$ 40" className={input} />
          </Field>
          <Field label="Pedido mínimo (R$)" htmlFor="minOrder">
            <input id="minOrder" name="minOrder" inputMode="decimal" placeholder="0,00" className={input} />
          </Field>
          <Field label="Limite total de usos" htmlFor="usageLimit" hint="Vazio = sem limite">
            <input id="usageLimit" name="usageLimit" type="number" min={1} className={input} />
          </Field>
          <Field label="Usos por cliente" htmlFor="perUserLimit">
            <input id="perUserLimit" name="perUserLimit" type="number" min={1} defaultValue={1} className={input} />
          </Field>
          <Field label="Início" htmlFor="startsAt">
            <input id="startsAt" name="startsAt" type="date" required defaultValue={today()} className={input} />
          </Field>
          <Field label="Fim" htmlFor="endsAt">
            <input id="endsAt" name="endsAt" type="date" required defaultValue={plusDays(7)} className={input} />
          </Field>
          <label className="flex h-11 items-center gap-2 self-end text-sm font-medium">
            <input type="checkbox" name="firstOrderOnly" className="size-4 accent-[var(--primary)]" />
            Só no primeiro pedido
          </label>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
            <Button type="submit" loading={create.isPending}>Criar promoção</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, htmlFor, hint, className, children }: {
  label: string; htmlFor: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={htmlFor} className="flex justify-between text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-foreground-tertiary">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
