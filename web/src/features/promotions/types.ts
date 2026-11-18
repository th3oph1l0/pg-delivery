/** Espelha o model `Coupon` do backend (backend/prisma/schema.prisma, schema "marketing"). */
export type PromotionType = 'PERCENT' | 'FIXED' | 'FREE_DELIVERY';

export interface Promotion {
  id: string;
  code: string;
  description: string;
  type: PromotionType;
  /** bps para PERCENT (1000 = 10%), centavos para FIXED, ignorado em FREE_DELIVERY */
  value: number;
  maxDiscountCents?: number | null;
  minOrderCents: number;
  usageLimit?: number | null;
  perUserLimit: number;
  firstOrderOnly: boolean;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  /** Agregados para o painel (não existem no model; vêm de coupon_redemptions) */
  redemptions: number;
  discountGivenCents: number;
}

export type NewPromotion = Omit<Promotion, 'id' | 'isActive' | 'redemptions' | 'discountGivenCents'>;

/** Situação calculada a partir de isActive + datas + limite de uso. */
export type PromotionStatus = 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'ENDED';

export function promotionStatus(p: Promotion, now = Date.now()): PromotionStatus {
  if (new Date(p.endsAt).getTime() < now) return 'ENDED';
  if (p.usageLimit != null && p.redemptions >= p.usageLimit) return 'ENDED';
  if (!p.isActive) return 'PAUSED';
  if (new Date(p.startsAt).getTime() > now) return 'SCHEDULED';
  return 'ACTIVE';
}

export const STATUS_META: Record<PromotionStatus, { label: string; tone: 'success' | 'info' | 'warning' | 'neutral' }> = {
  ACTIVE: { label: 'Ativa', tone: 'success' },
  SCHEDULED: { label: 'Agendada', tone: 'info' },
  PAUSED: { label: 'Pausada', tone: 'warning' },
  ENDED: { label: 'Encerrada', tone: 'neutral' },
};

export const TYPE_LABEL: Record<PromotionType, string> = {
  PERCENT: 'Desconto em %',
  FIXED: 'Desconto em R$',
  FREE_DELIVERY: 'Frete grátis',
};
