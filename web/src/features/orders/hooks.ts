'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { DEMO } from '@/lib/api-client';
import { useSessionStore } from '@/stores/session-store';
import { useUiStore } from '@/stores/ui-store';
import { fetchActiveOrders, fetchDashboard, optimisticStatus, runOrderAction, type OrderAction } from './api';
import type { MerchantOrder } from './types';

export const orderKeys = {
  active: (rid: string) => ['merchant', rid, 'orders', 'active'] as const,
  dashboard: (rid: string) => ['merchant', rid, 'dashboard'] as const,
};

export function useActiveOrders() {
  const rid = useSessionStore((s) => s.restaurantId)!;
  return useQuery({
    queryKey: orderKeys.active(rid),
    queryFn: () => fetchActiveOrders(rid),
    refetchInterval: 30_000, // rede de segurança; o caminho principal é o WebSocket
  });
}

export function useDashboard() {
  const rid = useSessionStore((s) => s.restaurantId)!;
  return useQuery({ queryKey: orderKeys.dashboard(rid), queryFn: () => fetchDashboard(rid) });
}

/** Atualização otimista: o card muda de coluna na hora e volta se a API falhar. */
export function useOrderAction() {
  const qc = useQueryClient();
  const rid = useSessionStore((s) => s.restaurantId)!;
  const key = orderKeys.active(rid);

  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: OrderAction }) => runOrderAction(rid, orderId, action),
    onMutate: async ({ orderId, action }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MerchantOrder[]>(key);
      qc.setQueryData<MerchantOrder[]>(key, (old) =>
        old?.map((o) => (o.id === orderId ? { ...o, status: optimisticStatus(action) } : o)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      toast.error('Não foi possível atualizar o pedido. Tente novamente.');
    },
    onSuccess: (_data, { action }) => {
      if (action.kind === 'accept') toast.success('Pedido aceito: bom preparo!');
      if (action.kind === 'ready') toast.success('Pedido pronto. Avisamos o entregador.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

/** Assina eventos em tempo real da loja e invalida o cache do kanban. */
export function useMerchantRealtime() {
  const qc = useQueryClient();
  const { restaurantId, accessToken } = useSessionStore();
  const soundEnabled = useUiStore((s) => s.soundEnabled);

  useEffect(() => {
    if (DEMO || !restaurantId || !accessToken) return;
    const socket = io(process.env.NEXT_PUBLIC_RT_URL ?? 'http://localhost:3000/rt', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socket.emit('subscribe:merchant', { restaurantId });
    socket.on('order:new', () => {
      if (soundEnabled) void new Audio('/sounds/new-order.mp3').play().catch(() => undefined);
      toast('Novo pedido chegou! 🔔');
      void qc.invalidateQueries({ queryKey: orderKeys.active(restaurantId) });
    });
    socket.on('order:status', () => void qc.invalidateQueries({ queryKey: orderKeys.active(restaurantId) }));
    return () => {
      socket.disconnect();
    };
  }, [restaurantId, accessToken, soundEnabled, qc]);
}
