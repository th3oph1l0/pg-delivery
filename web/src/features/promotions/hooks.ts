'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSessionStore } from '@/stores/session-store';
import { createPromotion, fetchPromotions, setPromotionActive } from './api';
import type { NewPromotion, Promotion } from './types';

export const promotionKeys = {
  list: (rid: string) => ['merchant', rid, 'promotions'] as const,
};

export function usePromotions() {
  const rid = useSessionStore((s) => s.restaurantId)!;
  return useQuery({ queryKey: promotionKeys.list(rid), queryFn: () => fetchPromotions(rid) });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  const rid = useSessionStore((s) => s.restaurantId)!;
  return useMutation({
    mutationFn: (input: NewPromotion) => createPromotion(rid, input),
    onSuccess: (p) => toast.success(`Promoção ${p.code} criada.`),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Não foi possível criar a promoção.'),
    onSettled: () => qc.invalidateQueries({ queryKey: promotionKeys.list(rid) }),
  });
}

/** Pausar/reativar com atualização otimista. */
export function useTogglePromotion() {
  const qc = useQueryClient();
  const rid = useSessionStore((s) => s.restaurantId)!;
  const key = promotionKeys.list(rid);
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setPromotionActive(rid, id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Promotion[]>(key);
      qc.setQueryData<Promotion[]>(key, (old) => old?.map((p) => (p.id === id ? { ...p, isActive } : p)));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      toast.error('Não foi possível atualizar a promoção.');
    },
    onSuccess: (p) => toast.success(p.isActive ? `${p.code} reativada.` : `${p.code} pausada.`),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
