import { api, DEMO } from '@/lib/api-client';
import type { NewPromotion, Promotion } from './types';

// ── Dados de demonstração (NEXT_PUBLIC_DEMO=true) ────────────────────────────
const day = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * day).toISOString();

let demoPromotions: Promotion[] = [
  { id: 'p1', code: 'PEQUENO10', description: '10% em qualquer pedido acima de R$ 40', type: 'PERCENT', value: 1000,
    maxDiscountCents: 1500, minOrderCents: 4000, usageLimit: 500, perUserLimit: 1, firstOrderOnly: false,
    startsAt: at(-10), endsAt: at(20), isActive: true, redemptions: 184, discountGivenCents: 92_340 },
  { id: 'p2', code: 'FRETEZERO', description: 'Frete grátis na sexta à noite', type: 'FREE_DELIVERY', value: 0,
    minOrderCents: 3000, usageLimit: null, perUserLimit: 2, firstOrderOnly: false,
    startsAt: at(-3), endsAt: at(4), isActive: true, redemptions: 61, discountGivenCents: 42_700 },
  { id: 'p3', code: 'BEMVINDO', description: 'R$ 15 off no primeiro pedido', type: 'FIXED', value: 1500,
    minOrderCents: 3500, usageLimit: null, perUserLimit: 1, firstOrderOnly: true,
    startsAt: at(-30), endsAt: at(60), isActive: false, redemptions: 37, discountGivenCents: 55_500 },
  { id: 'p4', code: 'COMBO20', description: '20% nos combos entre 19h e 21h', type: 'PERCENT', value: 2000,
    maxDiscountCents: 2000, minOrderCents: 0, usageLimit: 300, perUserLimit: 1, firstOrderOnly: false,
    startsAt: at(2), endsAt: at(16), isActive: true, redemptions: 0, discountGivenCents: 0 },
  { id: 'p5', code: 'BLACKGIGANTE', description: 'Black Friday: 25% em tudo', type: 'PERCENT', value: 2500,
    maxDiscountCents: 3000, minOrderCents: 5000, usageLimit: 200, perUserLimit: 1, firstOrderOnly: false,
    startsAt: at(-40), endsAt: at(-25), isActive: true, redemptions: 200, discountGivenCents: 418_900 },
];
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ── API ─────────────────────────────────────────────────────────────────────
export async function fetchPromotions(rid: string): Promise<Promotion[]> {
  if (DEMO) return wait().then(() => demoPromotions);
  return api<Promotion[]>(`/merchant/${rid}/promotions`);
}

export async function createPromotion(rid: string, input: NewPromotion): Promise<Promotion> {
  if (DEMO) {
    await wait(300);
    if (demoPromotions.some((p) => p.code === input.code)) throw new Error('Já existe uma promoção com esse código.');
    const created: Promotion = { ...input, id: crypto.randomUUID(), isActive: true, redemptions: 0, discountGivenCents: 0 };
    demoPromotions = [created, ...demoPromotions];
    return created;
  }
  return api<Promotion>(`/merchant/${rid}/promotions`, {
    method: 'POST',
    body: JSON.stringify(input),
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function setPromotionActive(rid: string, id: string, isActive: boolean): Promise<Promotion> {
  if (DEMO) {
    await wait(250);
    demoPromotions = demoPromotions.map((p) => (p.id === id ? { ...p, isActive } : p));
    return demoPromotions.find((p) => p.id === id)!;
  }
  return api<Promotion>(`/merchant/${rid}/promotions/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}
