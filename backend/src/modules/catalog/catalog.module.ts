import { Controller, Get, Module, OnModuleInit, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { NotFoundError } from '../../shared/domain/domain-error';
import { KafkaService } from '../../shared/infrastructure/kafka/kafka.service';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { Public } from '../../shared/presentation/auth';

export class NearbyQueryDto {
  @Type(() => Number) @IsLatitude() lat: number;
  @Type(() => Number) @IsLongitude() lng: number;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(500) @Max(20_000) maxDistance = 8_000;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) minRating?: number;
  @IsOptional() @Type(() => Boolean) @IsBoolean() freeDelivery?: boolean;
  @IsOptional() @IsIn(['distance', 'rating', 'eta', 'fee']) sort: 'distance' | 'rating' | 'eta' | 'fee' = 'distance';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
}

interface RestaurantCardRow {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  rating: number;
  rating_count: number;
  delivery_fee_cents: number;
  avg_prep_minutes: number;
  is_open: boolean;
  sponsored: boolean;
  distance_m: number;
}

@ApiTags('catalog')
@Public()
@Controller({ version: '1' })
export class CatalogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Lojas próximas. Usa a coluna PostGIS `geo` + índice GiST (docs/03-banco-de-dados.md).
   * Na V1 a busca textual migra para o OpenSearch.
   */
  @Get('restaurants')
  async nearby(@Query() f: NearbyQueryDto) {
    const order = {
      distance: 'is_open DESC, distance_m ASC',
      rating: 'is_open DESC, rating DESC',
      eta: 'is_open DESC, (avg_prep_minutes + distance_m / 250) ASC',
      fee: 'is_open DESC, delivery_fee_cents ASC',
    }[f.sort];

    const rows = await this.prisma.$queryRawUnsafe<RestaurantCardRow[]>(
      `SELECT id, slug, name, logo_url, rating::float AS rating, rating_count, delivery_fee_cents,
              avg_prep_minutes, is_open, (sponsored_until > now()) AS sponsored,
              ST_Distance(geo, ST_MakePoint($2, $1)::geography) AS distance_m
         FROM restaurant.restaurants
        WHERE is_active
          AND ST_DWithin(geo, ST_MakePoint($2, $1)::geography, $3)
          AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%')
          AND ($5::float IS NULL OR rating >= $5)
          AND ($6::boolean IS NOT TRUE OR delivery_fee_cents = 0)
        ORDER BY ${order}
        LIMIT $7`,
      f.lat,
      f.lng,
      f.maxDistance,
      f.q ?? null,
      f.minRating ?? null,
      f.freeDelivery ?? null,
      f.limit,
    );

    return {
      data: rows.map((r) => {
        const travelMin = Math.round(r.distance_m / 250); // ~15 km/h em moto urbana
        const base = r.avg_prep_minutes + travelMin + 5;
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          logoUrl: r.logo_url,
          rating: r.rating,
          ratingCount: r.rating_count,
          distanceMeters: Math.round(r.distance_m),
          etaMinutes: [base, base + 10],
          deliveryFeeCents: r.delivery_fee_cents,
          isOpen: r.is_open,
          isSponsored: r.sponsored,
        };
      }),
    };
  }

  /** Cardápio completo com cache versionado (invalidação por evento catalog.product.updated). */
  @Get('restaurants/:id/menu')
  async menu(@Param('id', ParseUUIDPipe) id: string) {
    const version = (await this.redis.get(`catalog:menu-version:${id}`)) ?? '0';
    return this.redis.remember(`catalog:menu:${id}:v${version}`, 600, async () => {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          bannerUrl: true,
          logoUrl: true,
          rating: true,
          isOpen: true,
          openingHours: { select: { weekday: true, opensAt: true, closesAt: true } },
          categories: {
            where: { isActive: true },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              products: {
                where: { isAvailable: true },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  imageUrl: true,
                  priceCents: true,
                  promoPriceCents: true,
                  serves: true,
                  tags: true,
                  isFeatured: true,
                  optionGroups: {
                    orderBy: { position: 'asc' },
                    select: {
                      id: true,
                      name: true,
                      minSelect: true,
                      maxSelect: true,
                      options: { where: { isAvailable: true }, select: { id: true, name: true, priceCents: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!restaurant) throw new NotFoundError('Restaurante', id);
      return restaurant;
    });
  }
}

/** Consumidor que invalida o cache do cardápio quando o catálogo muda. */
export class CatalogCacheInvalidator implements OnModuleInit {
  constructor(
    private readonly kafka: KafkaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_CONSUMERS_ENABLED === 'false') return;
    await this.kafka.subscribe('catalog-cache-invalidator', ['pg.catalog.events'], async (event) => {
      const restaurantId = (event.data as { restaurantId?: string }).restaurantId;
      if (restaurantId) await this.redis.incr(`catalog:menu-version:${restaurantId}`);
    });
  }
}

@Module({
  controllers: [CatalogController],
  providers: [
    {
      provide: CatalogCacheInvalidator,
      useFactory: (k: KafkaService, r: RedisService) => new CatalogCacheInvalidator(k, r),
      inject: [KafkaService, RedisService],
    },
  ],
})
export class CatalogModule {}
