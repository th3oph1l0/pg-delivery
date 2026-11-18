export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface MerchantOrder {
  id: string;
  code: string;
  status: OrderStatus;
  totalCents: number;
  notes?: string | null;
  createdAt: string;
  customer: { name: string };
  items: { productName: string; quantity: number; options: { name: string }[]; notes?: string | null }[];
  courier?: { name: string; etaAt?: string } | null;
}

export interface DashboardKpis {
  gmvCents: number;
  orders: number;
  avgTicketCents: number;
  cancelRate: number;
  prepTimeAvg: number;
  hourly: { hour: string; today: number; avg4w: number }[];
  topProducts: { name: string; qty: number }[];
  insight: string;
}

export const COLUMNS: { status: OrderStatus[]; title: string; tone: 'primary' | 'warning' | 'success' | 'info' }[] = [
  { status: ['PLACED'], title: 'Novos', tone: 'primary' },
  { status: ['CONFIRMED', 'PREPARING'], title: 'Em preparo', tone: 'warning' },
  { status: ['READY_FOR_PICKUP'], title: 'Prontos', tone: 'success' },
  { status: ['PICKED_UP'], title: 'Saiu para entrega', tone: 'info' },
];
