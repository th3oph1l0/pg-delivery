# 07 — Wireframes (baixa fidelidade)

Wireframes em texto, para guiar o protótipo de alta fidelidade no Figma. As dimensões de referência são 390×844 (mobile) e 1440×900 (web).

## App do Cliente

### C1. Home
```
┌──────────────────────────────────────┐
│ 📍 Entregar em  Rua X, 120 ▾    🔔 │
│ ┌──────────────────────────────────┐ │
│ │ 🔍 Buscar pratos ou restaurantes │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║  BANNER  "Frete grátis hoje" ●○○ ║ │
│ ╚══════════════════════════════════╝ │
│ (🍔)(🍕)(🍣)(🥗)(🍰)(🛒)  ← chips   │
│ [Frete grátis][Até 30 min][4.5+★]   │
│                                      │
│ Patrocinados                    Ver ›│
│ ┌──────┐┌──────┐┌──────┐            │
│ │ img  ││ img  ││ img  │  →          │
│ │Nome  ││Nome  ││Nome  │            │
│ └──────┘└──────┘└──────┘            │
│ Perto de você                        │
│ ┌──────────────────────────────────┐ │
│ │[logo] Burger do Zé        ♡     │ │
│ │       4,7★ · Lanches · 1,8 km    │ │
│ │       30–40 min · Grátis         │ │
│ └──────────────────────────────────┘ │
│ ...                                  │
├──────────────────────────────────────┤
│ 🏠 Início  🔍 Busca  🧾 Pedidos  👤 │
└──────────────────────────────────────┘
```

### C2. Busca + filtros (bottom sheet)
```
┌──────────────────────────────────────┐
│ ← [ 🔍 pizza              ✕ ]        │
│ [Ordenar ▾][Frete grátis][Filtros ⚙] │
│ Restaurantes (24) | Pratos (112)     │
│ ┌ card ┐ ┌ card ┐ ...                │
│ ┌──────── Filtros ────────────── ✕ ┐ │
│ │ Distância   ○───●──── 5 km       │ │
│ │ Avaliação   [4+★][4.5+★]         │ │
│ │ Entrega     [≤30][≤45][≤60] min  │ │
│ │ Preço       [$][$$][$$$]         │ │
│ │ ☑ Frete grátis                   │ │
│ │ Categoria   (chips...)           │ │
│ │ [Limpar]        [Ver 24 lojas]   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### C3. Loja
```
┌──────────────────────────────────────┐
│ ╔══════════ BANNER ════════════════╗ │
│ ║ ←                     ♡   ↗      ║ │
│ ╚══════════════════════════════════╝ │
│ [logo] Burger do Zé                  │
│ 4,7★ (1,2 mil) · Lanches · $$        │
│ 🕒 30–40 min · 🛵 Grátis · Mín R$20  │
│ Aberto até 23h  ·  Ver avaliações ›  │
│ ┌ 🎟 10% OFF acima de R$50 ───────┐  │
│ [Destaques][Burgers][Combos][Bebidas]│ ← tabs sticky
│ Destaques                            │
│ ┌──────────────────────────┬──────┐  │
│ │ X-Gigante                │ img  │  │
│ │ Pão brioche, 180g...     │      │  │
│ │ R$ 32,90  ~~R$ 38,90~~   │  (+) │  │
│ └──────────────────────────┴──────┘  │
├──────────────────────────────────────┤
│ [ Ver sacola · 2 itens · R$ 65,80 ]  │ ← sticky
└──────────────────────────────────────┘
```

### C4. Produto + complementos (bottom sheet 90%)
```
│ ╔═════════ imagem ═════════╗         │
│ X-Gigante            R$ 32,90        │
│ Pão brioche, blend 180g, cheddar     │
│ ── Ponto da carne  OBRIGATÓRIO 1/1 ──│
│  ◉ Ao ponto   ○ Bem passado          │
│ ── Adicionais        até 3 ──────────│
│  ☐ Bacon +R$4  ☐ Ovo +R$3            │
│ ── Alguma observação? ───────────────│
│  [ Ex.: sem cebola              ]    │
│ [ − 1 + ]   [ Adicionar  R$ 36,90 ]  │
```

### C5. Sacola / Carrinho
```
│ ← Sacola              Limpar         │
│ Burger do Zé                          │
│ 1× X-Gigante (Ao ponto, Bacon) R$36,90│ [−1+]
│ 1× Batata G                  R$18,90 │ [−1+]
│ + Adicionar mais itens               │
│ Peça também (IA) ┌──┐┌──┐┌──┐        │
│ 🎟 Cupom  [PEQUENO10]  ✓ −R$5,58     │
│ Observação para a loja [........]    │
│ Subtotal              R$ 55,80        │
│ Taxa de entrega       Grátis          │
│ Taxa de serviço       R$ 0,99         │
│ Desconto             −R$ 5,58         │
│ Total                 R$ 51,21        │
│ [        Continuar        ]          │
```

### C6. Checkout
```
│ ← Finalizar pedido                   │
│ Entregar em  🏠 Casa — Rua X, 120  › │
│ ⏱ Hoje, 30–40 min  ○ Agendar         │
│ Pagamento                            │
│  ◉ ⚡ PIX (aprovação na hora)         │
│  ○ 💳 Crédito •••• 4417          ›   │
│  ○  G Pay   ○  Apple Pay             │
│  ○ 👛 Carteira PG  (R$ 12,00)         │
│ CPF na nota  [ ]                      │
│ Gorjeta ao entregador [R$2][R$5][—]  │
│ Total  R$ 51,21                      │
│ [   Fazer pedido · R$ 51,21   ]      │
```

### C7. Acompanhamento em tempo real
```
┌──────────────────────────────────────┐
│ ╔══════════ MAPA ═══════════════════╗│
│ ║  🏪 ·····🛵·········· 🏠           ║│
│ ╚═══════════════════════════════════╝│
│ Chega entre 12:40 e 12:50            │
│ ●─────●─────●─────◉─────○            │
│ Confirmado Preparo Pronto A caminho  │
│ ┌──────────────────────────────────┐ │
│ │ (foto) Carlos · Moto · ⭐4,9      │ │
│ │ ABC-1D23   [💬 Chat] [📞]        │ │
│ └──────────────────────────────────┘ │
│ Código de entrega:  4 7 2 9          │
│ Detalhes do pedido ›   Ajuda ›       │
└──────────────────────────────────────┘
```

### C8. Pedidos · C9. Perfil
```
Pedidos                           Perfil
[Em andamento][Anteriores]        (avatar) Ana Souza ✎
┌─────────────────────────┐       🏆 Gigante Ouro · 1.240 pts ›
│ Burger do Zé · Entregue │       📍 Endereços             ›
│ 12/11 · R$ 51,21        │       💳 Cartões               ›
│ [Avaliar] [Pedir de novo]│      ♡  Favoritos             ›
└─────────────────────────┘       🎟 Cupons                ›
                                  ⚙ Configurações (tema, notificações, privacidade)
                                  ❓ Ajuda · Sair
```

## App do Entregador

### E1. Mapa / disponibilidade · E2. Oferta de corrida
```
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ Hoje R$ 142,50 · 9 entregas      ☰   │   │ NOVA CORRIDA              ⏱ 24s ◔    │
│ ╔═════════ MAPA + HEATMAP ═════════╗ │   │ R$ 9,80  (+ gorjeta R$ 3)            │
│ ║   🟥 alta demanda Centro          ║ │   │ 🏪 Burger do Zé · 1,2 km de você     │
│ ╚═══════════════════════════════════╝ │   │ 🏠 Entrega · 3,4 km                  │
│                                      │   │ Total estimado 18 min                │
│ ( ●  VOCÊ ESTÁ ONLINE )  ← toggle    │   │ [ Recusar ]  [■■■ Deslize p/ aceitar]│
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```

### E3. Em rota · E4. Ganhos
```
│ Coletar em Burger do Zé  [Navegar ↗] │   │ Ganhos   [Dia][Semana][Mês]          │
│ Pedido PG-7F3K2 · 2 itens            │   │ R$ 842,30   ▁▃▅▇▅▃▆                  │
│ [■■■ Deslize: cheguei na loja    ]   │   │ Entregas 61 · Gorjetas R$ 74         │
│ → depois: código do pedido → rota    │   │ Saldo disponível R$ 512,00           │
│ → entrega: digitar código do cliente │   │ [  Sacar via PIX  ]                  │
│                                      │   │ Avaliação 4,92 · Aceite 91% · #12 🏅 │
```

## Painel do Restaurante (web)

### R1. Dashboard · R2. Pedidos (kanban em tempo real)
```
┌────────┬───────────────────────────────────────────────────────────────────┐
│ PG     │ Burger do Zé ▾        ● Loja aberta [pausar]        🔔  👤       │
│        ├───────────────────────────────────────────────────────────────────┤
│ Painel │ Hoje ▾                                                            │
│ Pedidos│ ┌Faturamento┐┌Pedidos┐┌Ticket médio┐┌Cancelamento┐┌Tempo preparo┐ │
│ Cardáp.│ │R$ 4.820   ││ 96    ││ R$ 50,20   ││ 1,8%       ││ 14 min      │ │
│ Promo  │ └───────────┘└───────┘└────────────┘└────────────┘└─────────────┘ │
│ Relat. │ [gráfico de linha: pedidos/hora hoje × média 4 semanas]           │
│ Financ.│ Top produtos | Avaliações recentes | 💡 Insight IA: "Ative combo │
│ Config │  Batata+Refri entre 19–21h: +8% ticket estimado"                  │
└────────┴───────────────────────────────────────────────────────────────────┘

Pedidos:
│ NOVOS (2) 🔔     │ EM PREPARO (5)    │ PRONTOS (1)       │ SAIU (3)         │
│ ┌PG-7F3K2 ⏱1:20┐ │ ┌PG-A1… 08 min┐   │ ┌PG-… aguard. ┐   │ ┌PG-… Carlos 🛵┐ │
│ │2× X-Gigante  │ │ │...           │   │ │entregador 2m │   │ │ETA 12:44     │ │
│ │[Recusar][Aceitar]│ [Pronto ✓]   │   │                   │                  │
```

### R3. Cardápio
```
│ Categorias  [+ Categoria] │ Produtos de "Burgers"         [+ Produto] 🔍 │
│ ≡ Destaques               │ ≡ [img] X-Gigante  R$32,90  Estoque ∞  [● on]│
│ ≡ Burgers   (drag & drop) │ ≡ [img] X-Salada   R$27,90  Estoque 12 [● on]│
│ ≡ Combos                  │ Editar: nome, desc, preço, foto, grupos de   │
│                           │ complementos (min/max), disponibilidade/horário│
```

## Painel Admin Master

### A1. Operação ao vivo
```
┌────────┬───────────────────────────────────────────────────────────────────┐
│ Admin  │ Cidade [Volta Redonda ▾]  Pedidos ativos 412 · Entregadores 188   │
│ Ops    │ ╔══════════ MAPA: lojas 🏪, entregadores 🛵, heatmap ═══════════╗│
│ Gestão │ ╚═══════════════════════════════════════════════════════════════╝│
│ Financ.│ Alertas: ⚠ 3 pedidos sem entregador > 8 min [reatribuir]         │
│ Config │          ⚠ Loja X com 4 recusas seguidas [contatar]               │
│ Audit. │ Tabela de pedidos: filtros status/cidade/loja, ações em massa      │
└────────┴───────────────────────────────────────────────────────────────────┘
```
