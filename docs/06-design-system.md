# 06 — Design System "Gigante"

## Identidade

**Conceito:** *pequeno no tamanho, gigante na entrega.* Uma marca calorosa (cor que abre o apetite), confiante e brasileira. O logotipo é um monograma **pg** com o "g" cuja descendente vira uma seta de movimento.

**Tom de voz:** próximo, direto e otimista. "Seu pedido já tá a caminho 🛵" em vez de "Pedido em rota de entrega".

## 11.1 Cores

Todos os pares de texto/fundo foram verificados com a fórmula WCAG 2.2 (resultado ao lado).

### Marca

| Token | Light | Dark | Uso | Contraste |
|---|---|---|---|---|
| `brand.primary` | `#D91A27` "Vermelho Ketchup" | `#FF5A5F` | CTAs, links, seleção | branco 5.09:1 · no dark, texto `#1A0F0C` 6.16:1 |
| `brand.primaryPressed` | `#B5121D` | `#FF8A8A` | Estado pressionado | 6.84:1 |
| `brand.primaryContainer` | `#FFF3EF` | `#4A1A17` | Chips, badges de promoção | — |
| `brand.secondary` | `#0E7A55` "Verde Folha" | `#4ADE80` | Frete grátis, sucesso, entregador | 5.34:1 · 10.82:1 |
| `brand.accent` | `#FFC72C` "Amarelo Queijo" | `#FFC72C` | Destaques, pontos de fidelidade (sempre com texto escuro) | 10.94:1 |

### Neutros (escala "Creme")

| Token | Light | Dark |
|---|---|---|
| `bg.canvas` | `#FFFFFF` | `#1A0F0C` |
| `bg.surface` | `#FFF8F1` (creme) | `#241612` |
| `bg.elevated` | `#FFFFFF` | `#2E1D18` |
| `bg.muted` | `#FFF1E6` | `#33221C` |
| `border.default` | `#F2E2D4` | `#47322A` |
| `text.primary` | `#2A1712` (16.2:1) | `#F3E6DC` (15.4:1) |
| `text.secondary` | `#6B4E43` (7.1:1) | `#BFA89C` (8.3:1) |
| `text.tertiary` | `#7F6157`. Mínimo AA, então nunca usar abaixo de 12 px | `#9C8579` (5.4:1) |

### Semânticas

| Token | Light | Dark |
|---|---|---|
| `success` | `#0E7A55` | `#4ADE80` |
| `warning` | `#B45309` | `#FBBF24` |
| `danger` | `#B91C1C` | `#F87171` |
| `info` | `#1D4ED8` | `#60A5FA` |

**Regra:** a cor nunca é o único indicador. Status de pedido sempre combina **ícone + texto + cor**.

## 11.2 Tipografia

| Papel | Fonte | Motivo |
|---|---|---|
| Display / títulos | **Plus Jakarta Sans** (700/800) | Geométrica, calorosa e com personalidade; boa em números de preço |
| Texto / UI | **Inter** (400/500/600) | Legibilidade máxima em telas pequenas, numerais tabulares (`tnum`) para preços |

Ambas são gratuitas (Google Fonts / OFL) e têm suporte completo a PT-BR.

| Token | Tamanho / altura de linha | Peso | Uso |
|---|---|---|---|
| `display` | 32/40 | 800 | Hero, saldo |
| `h1` | 24/32 | 700 | Título de tela |
| `h2` | 20/28 | 700 | Seções ("Perto de você") |
| `h3` | 17/24 | 600 | Nome do restaurante no card |
| `body` | 15/22 | 400 | Texto padrão |
| `bodyStrong` | 15/22 | 600 | Preço |
| `caption` | 13/18 | 500 | Metadados (4,7 ★ · 30–40 min) |
| `overline` | 11/16 (+0.08em, MAIÚSCULAS) | 600 | Rótulos de seção |

Suporte a **Dynamic Type / escala de fonte do sistema até 200%**: os layouts usam `Flexible` e quebram linha em vez de truncar preços.

## 11.3 Espaçamento, raio, elevação e movimento

- **Espaço** (grade de 4 pt): `0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72`
- **Raio**: `sm 8` (inputs) · `md 12` (cards) · `lg 16` (bottom sheets) · `xl 24` (banners) · `full` (chips, botões pill)
- **Elevação**: `e0` plano · `e1 0 1 2 /6%` (cards) · `e2 0 4 12 /8%` (sticky bar) · `e3 0 12 32 /12%` (modais). No dark, a elevação é indicada pela cor da superfície, não pela sombra.
- **Movimento**: `fast 120ms`, `base 200ms`, `slow 320ms`, com curva `cubic-bezier(.2,.8,.2,1)`. Tudo respeita `prefers-reduced-motion` / `MediaQuery.disableAnimations`.
- **Alvo de toque** mínimo de **44×44 pt** (WCAG 2.5.8 pede 24×24; adotamos o padrão iOS/M3, que é mais exigente).

## 11.4 Componentes

| Componente | Variantes | Estados | Notas de acessibilidade |
|---|---|---|---|
| **Button** | `primary`, `secondary` (contorno), `ghost`, `danger`, `success`; tamanhos `sm 36`/`md 44`/`lg 52`; `icon`, `loading`, `full-width` | default, hover, pressed, focus (anel de 2 px `primary` + offset de 2 px), disabled (40% de opacidade + `aria-disabled`), loading (spinner + rótulo mantido para leitor de tela) | Rótulo de verbo ("Adicionar R$ 32,90") |
| **Input** | text, password (mostrar/ocultar), phone (máscara BR), CPF, CEP (autopreenche endereço), search (com limpar), OTP (6 caixas, `autocomplete="one-time-code"`) | default, focus, filled, error (ícone + mensagem abaixo, `aria-describedby`), disabled | Label sempre visível, nunca só placeholder |
| **Card** | `RestaurantCard` (horizontal/vertical), `ProductCard` (com imagem à direita estilo iFood), `OrderCard`, `PromoCard` | skeleton, fechado (grayscale + "Abre às 18h"), patrocinado (selo "Patrocinado") | Card inteiro clicável com um único rótulo semântico |
| **List / ListTile** | simples, com avatar, com swipe (remover endereço, favoritar) | — | Swipe sempre tem alternativa por menu ("Mais ações") — WCAG 2.5.7 |
| **Modal / Dialog** | confirmação, destrutivo, informativo | — | Foco preso, `Esc` fecha, foco retorna ao gatilho |
| **Bottom Sheet** | produto com complementos (arrastável, 90%), filtros, seleção de endereço, pagamento | — | Alça visível + botão "Fechar" |
| **Banner** | carrossel hero (auto-play pausável), inline promocional | — | Botão de pausa; `aria-roledescription="carrossel"` |
| **Chip** | filtro (toggle), categoria (com ícone), tag | selecionado/não | `aria-pressed` |
| **Badge** | status de pedido, desconto ("-20%"), "Novo", contador do carrinho | — | — |
| **Skeleton** | blocos com shimmer | — | `aria-busy="true"`; shimmer desativado com reduced motion |
| **Stepper de quantidade** | − 1 + | mínimo/máximo | Anuncia "Quantidade: 2" |
| **Rating** | estrelas de exibição e de entrada | — | Entrada de 1 a 5 como radio group |
| **Tracking timeline** | vertical com 5 etapas | concluída, atual (pulsando), futura | `aria-current="step"` |
| **Snackbar/Toast** | info, sucesso, erro (com "Desfazer") | — | `role="status"`, 4–6 s, pausa no hover |
| **Sticky Cart Bar** | "Ver sacola · 2 itens · R$ 68,00" | — | — |

## 11.5 Experiência

| Recurso | Implementação |
|---|---|
| Skeleton loading | Todas as listas e detalhes; nada de spinner de tela cheia após o primeiro carregamento |
| Pull to refresh | Home, pedidos, ganhos (`RefreshIndicator` / `react-simple-pull-to-refresh` no PWA) |
| Swipe actions | Endereços (remover), favoritos (desfavoritar), entregador (deslizar para confirmar coleta/entrega, o que evita toque acidental) |
| Dark mode | Segue o sistema por padrão, com opção manual em Configurações; tokens duplicados light/dark |
| Microinterações | "+1" voando para a sacola; coração com *bounce* ao favoritar; confete discreto em "Pedido entregue"; háptico leve (`HapticFeedback.lightImpact`) em adicionar/aceitar |
| Feedback instantâneo | UI otimista (favoritar, quantidade); rollback com toast se falhar; botões entram em loading em < 100 ms |
| Offline | Banner "Você está offline · mostrando dados salvos"; cardápio e pedidos ativos em cache; ações enfileiradas |

## 11.6 Acessibilidade (WCAG 2.2 AA): checklist de aceite

- [ ] Contraste de 4.5:1 para texto e 3:1 para componentes e ícones (tokens acima já validados)
- [ ] Toda imagem de produto tem `semanticLabel`/`alt` (gerado do nome + descrição curta). Imagens decorativas ficam `excludeSemantics`/`alt=""`
- [ ] Ordem de foco lógica; anel de foco visível e não encoberto por sticky bars (2.4.11)
- [ ] Alvo mínimo de 24×24 (2.5.8); adotamos 44
- [ ] Alternativa a gestos de arrastar (2.5.7); mapa com botões de zoom
- [ ] Sem armadilha de foco; modais devolvem o foco
- [ ] Autenticação acessível (3.3.8): login social, OTP com autofill e colar habilitado, sem CAPTCHA cognitivo
- [ ] Entrada redundante (3.3.7): endereço e cartão salvos não são pedidos de novo
- [ ] Ajuda consistente (3.2.6): o botão "Ajuda" fica sempre no mesmo lugar
- [ ] Mudanças dinâmicas anunciadas (status do pedido via `SemanticsService.announce` / `aria-live="polite"`)
- [ ] Testes automatizados: `axe-core` + Playwright no web; `flutter test` com `meetsGuideline(textContrastGuideline)` e `androidTapTargetGuideline`
- [ ] Teste manual por sprint com TalkBack, VoiceOver e NVDA

Os tokens estão implementados em `web/src/app/globals.css` (Tailwind v4 `@theme`) e em `mobile/lib/core/design_system/tokens/pg_tokens.dart`.
