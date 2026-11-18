# 14 — Inteligência Artificial e Geolocalização

## IA

| Caso de uso | Abordagem | Dados | Fase |
|---|---|---|---|
| **Recomendação de produtos/restaurantes** | Etapa 1: popularidade por região e horário + "pedidos parecidos". Etapa 2: filtragem colaborativa implícita (ALS ou *two-tower*) + re-ranking com regras (aberto, ETA, margem, diversidade) | Eventos de view, add_to_cart e pedido | V1 (regras) → V2 (ML) |
| **Upsell no carrinho** | Regras de associação (FP-Growth) por loja: "quem levou X levou Y" | Itens de pedidos | V1 |
| **Promoções personalizadas** | Segmentação RFM + propensão de churn (gradient boosting) → cupom no momento certo, com limite de orçamento | Histórico | V2 |
| **ETA** | Soma de componentes: aceite + preparo (modelo por loja/horário) + chegada do entregador + rota (Google Routes com trânsito) + "última milha" (prédio, portaria). LightGBM com quantis p50/p90 para exibir uma faixa ("30–40 min") | Timestamps de status, GPS | V1 → V2 em stream |
| **Previsão de demanda e picos** | Séries temporais por zona H3 (resolução 8) a cada 15 min: Prophet/LightGBM com clima, feriados e eventos | Pedidos históricos | V2 |
| **Incentivo dinâmico** | Demanda prevista × oferta de entregadores → bônus por zona e horário publicados com 1 h de antecedência | Previsão + GPS | V2 |
| **Chatbot** | LLM (Amazon Bedrock) com RAG nas políticas e FAQ, mais *tools*: `get_order_status`, `request_refund` (com alçada), `talk_to_human`. Guardrails: sem PII no prompt de log e transbordo humano quando o sentimento é negativo | Base de conhecimento | V2 |
| **FAQ automatizada** | Agrupamento de tickets → artigos sugeridos → resposta automática quando a confiança for alta | Tickets | V1/V2 |
| **Insights para restaurantes** | Detecção de anomalias (tempo de preparo, cancelamentos, nota) + LLM que redige a recomendação a partir de métricas estruturadas | Data lake | V3 |

**MLOps:** features no SageMaker Feature Store (online em Redis/offline em S3), treino semanal, deploy por endpoint com *shadow mode* antes da promoção e monitoramento de *drift*. Toda previsão degrada para uma heurística se o modelo estiver fora.

## Geolocalização

| Recurso | Implementação |
|---|---|
| **Mapas** | Google Maps SDK (Flutter `google_maps_flutter`, web `@vis.gl/react-google-maps`) com estilo customizado da marca (claro e escuro) |
| **Autocomplete e geocoding** | Places Autocomplete (New) com *session token*; cache de geocoding por CEP + número no Redis/Postgres |
| **Áreas de entrega** | Polígonos PostGIS por loja (desenhados no painel); `ST_Contains` para validar o endereço |
| **Geofencing** | Raio de 100 m na loja ("cheguei") e de 150 m no cliente, validado no app (`geofence_service`) **e** no backend (anti-spoofing: precisão do GPS, velocidade plausível, mock location) |
| **Tracking em tempo real** | App do entregador envia posição a cada 4 s em movimento e a cada 15 s parado, em lote se offline → WS gateway → Kafka `pg.courier.location` → Redis GEO + broadcast na sala `order:{id}`; o cliente interpola o marcador suavemente |
| **Matching** | `GEOSEARCH geo:couriers:{city} FROMLONLAT … BYRADIUS 3 km ASC COUNT 20` → score = 0,5·(1/tempo até a loja) + 0,2·rating + 0,2·taxa de aceite + 0,1·equidade (tempo ocioso) → oferta sequencial (30 s) ou *broadcast* para os 3 melhores no pico |
| **Cálculo de rota** | Google Routes API (`computeRoutes` com trânsito) para ETA e polyline; matriz OSRM própria para o matching (custo zero por chamada) |
| **ETA dinâmico** | Recalculado a cada nova posição significativa (> 200 m ou 60 s) e publicado como `delivery.eta_updated` |
| **Heat maps** | Agregação por hexágono **H3** (res. 8, ~0,7 km²) a cada 5 min: demanda (pedidos), oferta (entregadores) e razão. Exibido no app do entregador e no admin (deck.gl `H3HexagonLayer`) |
