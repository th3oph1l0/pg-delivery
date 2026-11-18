import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Cardápio' };

/** Próximo passo: CRUD com TanStack Query + drag-and-drop (dnd-kit) de categorias e produtos. */
export default function MenuPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Cardápio</h1>
        <Button>
          <Plus aria-hidden /> Novo produto
        </Button>
      </div>
      <Card className="p-10 text-center text-foreground-secondary">
        Gestão de categorias, produtos, complementos e estoque. Endpoints em <code>/merchant/:rid/products</code>.
      </Card>
    </section>
  );
}
