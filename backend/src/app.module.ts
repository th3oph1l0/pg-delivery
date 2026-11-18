import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { DeliveryModule } from './modules/delivery/tracking.gateway';
import { HealthModule } from './modules/health/health.module';
import { OrderModule } from './modules/order/order.module';
import { KafkaModule } from './shared/infrastructure/kafka/kafka.service';
import { OutboxModule } from './shared/infrastructure/outbox/outbox';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.service';
import { RedisModule } from './shared/infrastructure/redis/redis.service';
import { AuthGuard } from './shared/presentation/auth';
import { ProblemDetailsFilter } from './shared/presentation/problem-details.filter';

/**
 * Monólito modular: cada módulo em ./modules corresponde a um microsserviço
 * (docs/01-arquitetura.md §2) e só se comunica com os outros por eventos ou ports.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Em produção: ES256 com chave do Secrets Manager/KMS e JWKS público
    JwtModule.register({ global: true, secret: process.env.JWT_ACCESS_SECRET }),
    // Rate limit padrão: 120 req/min por IP; em produção usar storage Redis compartilhado
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    KafkaModule,
    OutboxModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    OrderModule,
    DeliveryModule,
    // Próximos: PaymentModule, CouponModule, LoyaltyModule, NotificationModule, RestaurantModule, UserModule, AdminModule, AnalyticsModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule {}
