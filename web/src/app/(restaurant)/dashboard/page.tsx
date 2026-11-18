'use client';

import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/primitives';
import { useDashboard } from '@/features/orders/hooks';
import { formatBRL } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const kpis = data
    ? [
        { label: 'Faturamento', value: formatBRL(data.gmvCents) },
        { label: 'Pedidos', value: String(data.orders) },
        { label: 'Ticket médio', value: formatBRL(data.avgTicketCents) },
        { label: 'Cancelamentos', value: `${(data.cancelRate * 100).toFixed(1).replace('.', ',')}%` },
        { label: 'Tempo de preparo', value: `${data.prepTimeAvg} min` },
      ]
    : [];
  const max = Math.max(1, ...(data?.hourly.flatMap((h) => [h.today, h.avg4w]) ?? [1]));

  return (
    <section aria-labelledby="titulo-painel" className="space-y-6">
      <div>
        <h1 id="titulo-painel" className="font-display text-2xl font-bold">
          Painel de hoje
        </h1>
        <p className="text-sm text-foreground-secondary">Indicadores atualizados a cada 30 segundos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
          : kpis.map((k) => (
              <Card key={k.label} className="p-5">
                <p className="text-[13px] font-medium text-foreground-secondary">{k.label}</p>
                <p className="mt-1 font-display text-[28px] font-extrabold leading-9">{k.value}</p>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos por hora</CardTitle>
            <p className="text-[13px] text-foreground-secondary">Hoje × média das últimas 4 semanas</p>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-56" />
            ) : (
              <figure>
                <div className="flex h-56 items-end gap-2" role="img" aria-label="Gráfico de barras de pedidos por hora">
                  {data.hourly.map((h) => (
                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-48 w-full items-end justify-center gap-0.5">
                        <div className="w-1/2 rounded-t-sm bg-border" style={{ height: `${(h.avg4w / max) * 100}%` }} title={`Média: ${h.avg4w}`} />
                        <div className="w-1/2 rounded-t-sm bg-primary" style={{ height: `${(h.today / max) * 100}%` }} title={`Hoje: ${h.today}`} />
                      </div>
                      <span className="text-[11px] text-foreground-tertiary">{h.hour}</span>
                    </div>
                  ))}
                </div>
                <figcaption className="mt-3 flex gap-4 text-[13px] text-foreground-secondary">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" aria-hidden /> Hoje</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-border" aria-hidden /> Média 4 semanas</span>
                </figcaption>
                {/* Tabela acessível equivalente para leitores de tela */}
                <table className="sr-only">
                  <caption>Pedidos por hora</caption>
                  <thead><tr><th>Hora</th><th>Hoje</th><th>Média</th></tr></thead>
                  <tbody>{data.hourly.map((h) => <tr key={h.hour}><td>{h.hour}</td><td>{h.today}</td><td>{h.avg4w}</td></tr>)}</tbody>
                </table>
              </figure>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mais vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {(data?.topProducts ?? []).map((p, i) => (
                  <li key={p.name} className="flex justify-between text-sm">
                    <span><span className="mr-2 font-semibold text-foreground-tertiary">{i + 1}</span>{p.name}</span>
                    <span className="font-semibold">{p.qty}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          {data?.insight && (
            <Card className="border-accent bg-accent/15">
              <CardContent className="flex gap-3 pt-5">
                <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p className="text-sm">
                  <strong className="font-semibold">Insight da IA: </strong>
                  {data.insight}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
