import { api, DEMO } from '@/lib/api-client';
import type { DashboardKpis, MerchantOrder, OrderStatus } from './types';

// ── Dados de demonstração (NEXT_PUBLIC_DEMO=true) ────────────────────────────
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
let demoOrders: MerchantOrder[] = [
  { id: 'o1', code: 'PG-7F3K2', status: 'PLACED', totalCents: 7100, createdAt: ago(1), customer: { name: 'Ana S.' }, notes: 'Interfone 302',
    items: [{ productName: 'X-Gigante', quantity: 2, options: [{ name: 'Ao ponto' }, { name: 'Bacon' }] }] },
  { id: 'o2', code: 'PG-Q8MZ4', status: 'PLACED', totalCents: 4590, createdAt: ago(3), customer: { name: 'Bruno L.' },
    items: [{ productName: 'Smash Duplo', quantity: 1, options: [] }, { productName: 'Batata G', quantity: 1, options: [] }] },
  { id: 'o3', code: 'PG-A1C9T', status: 'PREPARING', totalCents: 3890, createdAt: ago(9), customer: { name: 'Carla M.' },
    items: [{ productName: 'X-Salada', quantity: 1, options: [{ name: 'Sem cebola' }] }] },
  { id: 'o4', code: 'PG-H2W7R', status: 'CONFIRMED', totalCents: 9280, createdAt: ago(6), customer: { name: 'Diego R.' },
    items: [{ productName: 'Combo Família', quantity: 1, options: [{ name: 'Refri 2L' }] }] },
  { id: 'o5', code: 'PG-K4N8P', status: 'READY_FOR_PICKUP', totalCents: 5210, createdAt: ago(17), customer: { name: 'Elisa F.' },
    items: [{ productName: 'X-Gigante', quantity: 1, options: [] }] },
  { id: 'o6', code: 'PG-Z9X3B', status: 'PICKED_UP', totalCents: 6120, createdAt: ago(28), customer: { name: 'Felipe G.' },
    courier: { name: 'Carlos', etaAt: new Date(Date.now() + 9 * 60_000).toISOString() },
    items: [{ productName: 'Smash Duplo', quantity: 2, options: [] }] },
];

const demoKpis: DashboardKpis = {
  gmvCents: 482_000,
  orders: 96,
  avgTicketCents: 5021,
  cancelRate: 0.018,
  prepTimeAvg: 14,
  hourly: ['11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'].map((hour, i) => ({
    hour,
    today: [4, 14, 12, 5, 2, 2, 3, 8, 16, 18, 9, 3][i],
    avg4w: [3, 11, 10, 4, 2, 2, 3, 7, 13, 15, 10, 4][i],
  })),
  topProducts: [
    { name: 'X-Gigante', qty: 38 },
    { name: 'Smash Duplo', qty: 27 },
    { name: 'Batata G', qty: 25 },
    { name: 'Combo Família', qty: 11 },
  ],
  insight: 'Combos com batata + refri entre 19h e 21h podem aumentar o ticket médio em ~8% (baseado nas últimas 4 sextas).',
};
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ── API ─────────────────────────────────────────────────────────────────────
export async function fetchActiveOrders(rid: string): Promise<MerchantOrder[]> {
  if (DEMO) return wait().then(() => demoOrders);
  return api<MerchantOrder[]>(`/merchant/${rid}/orders`);
}

export async function fetchDashboard(rid: string): Promise<DashboardKpis> {
  if (DEMO) return wait(500).then(() => demoKpis);
  return api<DashboardKpis>(`/merchant/${rid}/dashboard?range=today`);
}

export type OrderAction = { kind: 'accept'; prepMinutes: number } | { kind: 'reject'; reason: string } | { kind: 'ready' };

const NEXT: Record<OrderAction['kind'], OrderStatus> = { accept: 'PREPARING', reject: 'CANCELLED', ready: 'READY_FOR_PICKUP' };

export async function runOrderAction(rid: string, orderId: string, action: OrderAction): Promise<{ status: OrderStatus }> {
  if (DEMO) {
    await wait(250);
    demoOrders = demoOrders.map((o) => (o.id === orderId ? { ...o, status: NEXT[action.kind] } : o));
    return { status: NEXT[action.kind] };
  }
  const { kind, ...body } = action;
  return api(`/merchant/${rid}/orders/${orderId}/${kind}`, { method: 'POST', body: JSON.stringify(body) });
}

export const optimisticStatus = (action: OrderAction) => NEXT[action.kind];
