-- Rodar após `prisma migrate dev --name init` (ou incluir numa migração --create-only).
-- Recursos que o Prisma não modela: colunas geográficas, índices GIN/GiST/parciais e particionamento.

-- 1) Geografia das lojas
ALTER TABLE restaurant.restaurants
  ADD COLUMN IF NOT EXISTS geo geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
CREATE INDEX IF NOT EXISTS idx_restaurants_geo ON restaurant.restaurants USING gist (geo);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_area ON restaurant.delivery_zones USING gist (area);

-- 2) Busca textual (fallback antes do OpenSearch)
CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm ON restaurant.restaurants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON catalog.products USING gin (name gin_trgm_ops);

-- 3) Índices parciais quentes
CREATE INDEX IF NOT EXISTS idx_orders_active ON ordering.orders (restaurant_id, created_at DESC)
  WHERE status IN ('PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP','PICKED_UP');
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON platform.outbox_events (created_at)
  WHERE published_at IS NULL;

-- 4) Particionamento de courier_locations por dia (exemplo; o pg_partman automatiza)
--    Em ambiente novo, criar a tabela já particionada:
-- CREATE TABLE delivery.courier_locations (
--   id bigint GENERATED ALWAYS AS IDENTITY,
--   courier_id uuid NOT NULL, delivery_id uuid, lat double precision NOT NULL, lng double precision NOT NULL,
--   heading double precision, speed_kmh double precision, recorded_at timestamptz NOT NULL,
--   PRIMARY KEY (id, recorded_at)
-- ) PARTITION BY RANGE (recorded_at);
-- SELECT partman.create_parent('delivery.courier_locations', 'recorded_at', '1 day', p_premake => 7);
-- UPDATE partman.part_config SET retention = '90 days', retention_keep_table = false
--   WHERE parent_table = 'delivery.courier_locations';
