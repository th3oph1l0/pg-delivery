# 13 — Monetização e Lançamento

## 22. Plano de Monetização

### Posicionamento

O "Pequeno Gigante" é **o app de delivery do interior forte**: cidades médias (100–500 mil habitantes), onde os grandes players têm cobertura e atenção comercial menores, as comissões são percebidas como altas e o restaurante quer um parceiro próximo. O nome reforça a proposta: estrutura enxuta, entrega gigante.

### Fontes de receita

| Fonte | Modelo | Valor de referência |
|---|---|---|
| **Comissão — Plano Entrega PG** (logística nossa) | % sobre o subtotal | **18%** + taxa de pagamento online de 3,2% |
| **Comissão — Plano Básico** (o restaurante entrega) | % sobre o subtotal | **10%** + 3,2% |
| **Plano Fundador** (primeiros 100 restaurantes por cidade) | Comissão reduzida por 12 meses | 8% básico / 15% entrega |
| **Taxa de entrega** (cliente) | Dinâmica por distância e demanda | R$ 4,99–12,99; a maior parte remunera o entregador |
| **Taxa de serviço** (cliente) | Fixa por pedido | R$ 0,99 (isenta para assinantes) |
| **Assinatura PG Gigante+** (V2) | Mensal | R$ 9,90/mês: frete grátis ilimitado acima de R$ 30 + cupons exclusivos |
| **Ads / patrocinados** (V2) | CPC em leilão, destaque na home e na busca | Lance mínimo de R$ 0,30/clique |
| **Mensalidade de software** (opcional) | SaaS para restaurantes com ferramentas avançadas (CRM, cardápio digital para salão, BI) | R$ 99–199/mês |
| **Serviços financeiros** (V3) | Antecipação de recebíveis via parceiro, *take rate* sobre o spread | — |

### Unit economics (alvo V1, ticket médio de R$ 55)

| Linha | R$ por pedido |
|---|---:|
| Comissão 18% | 9,90 |
| Taxa online 3,2% | 1,76 |
| Taxa de serviço | 0,99 |
| Taxa de entrega paga pelo cliente | 6,99 |
| **Receita bruta** | **19,64** |
| (−) Repasse ao entregador | (8,50) |
| (−) Custo de pagamento (~2,5% sobre R$ 62,98 do total cobrado) | (1,57) |
| (−) Cupons e incentivos | (2,20) |
| (−) Infra + mapas + SMS | (0,60) |
| (−) Suporte (custo médio) | (0,70) |
| **Margem de contribuição** | **≈ 6,07 (≈ 11% do GMV)** |

**Regra de ouro:** o subsídio por cupom só entra em cidades com coorte de recompra ≥ 35% no M2. Fora disso, o investimento vai para o restaurante (Plano Fundador).

## 23. Plano de Lançamento

### Fase 0: Preparação (T−8 a T−4 semanas)

- Escolher a cidade-piloto por: população de 150–300 mil, densidade de restaurantes, presença limitada da concorrência e proximidade do time
- **Supply primeiro:** time comercial de 2–3 pessoas fecha **50 restaurantes** (meta de 8 âncoras conhecidas) com o Plano Fundador, sessão de fotos do cardápio grátis e tablet emprestado
- **Frota:** recrutar **80 entregadores** (MEIs) com garantia mínima por hora nas 4 primeiras semanas nos horários de pico; parcerias com associações de motoboys
- Jurídico: termos de uso, política de privacidade, contratos com restaurantes e entregadores, nota fiscal de serviço (intermediação)

### Fase 1: Beta fechado (T−4 a T0)

- 300–500 usuários convidados (funcionários dos restaurantes, universidade local, lista de espera)
- Pedidos reais com cupom de 50%; correção diária; testes de pico simulados com k6
- Critérios para abrir: ≥ 95% de pedidos concluídos, 0 bugs S1 abertos, tempo médio ≤ 40 min

### Fase 2: Lançamento público (T0 a T+8 semanas)

| Canal | Ação |
|---|---|
| Lançamento | Evento "Semana Gigante": frete grátis e R$ 15 OFF no 1º pedido (cupom `GIGANTE15`) |
| Indicação | "Dê R$ 10, ganhe R$ 10" (crédito liberado após o 1º pedido entregue do indicado) |
| Mídia local | Rádio, influenciadores locais (micro, 10–50 mil seguidores), adesivos nas bags e nas lojas |
| Performance | Meta Ads + Google App Campaigns com geofence da cidade; CAC alvo < R$ 25 |
| Restaurantes | Material de divulgação do QR "Peça pelo PG" para colar no balcão e nas embalagens |
| Universidades | Embaixadores e cupons de campus |

### Fase 3: Expansão (T+3 meses em diante)

Para replicar em uma nova cidade, os critérios são: piloto com contribuição positiva por pedido, recompra ≥ 35% no M2 e NPS ≥ 45. Usar um *playbook* de 30 dias por cidade: comercial → frota → beta → lançamento. Ordem sugerida: cidades vizinhas para compartilhar a operação, depois polos regionais.

### KPIs de lançamento (painel semanal)

| Métrica | Meta na semana 8 |
|---|---|
| Pedidos/semana | 1.500 |
| Clientes ativos (30 dias) | 3.000 |
| Recompra no M1 | ≥ 40% |
| Tempo médio de entrega | ≤ 38 min |
| Cancelamentos | ≤ 3% |
| Avaliação média do app | ≥ 4,6 |
| Restaurantes ativos com ≥ 10 pedidos/semana | 70% |
| Ganho/hora do entregador no pico | ≥ R$ 25 |
