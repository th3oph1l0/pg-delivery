import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { Public } from '../../shared/presentation/auth';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Liveness: o processo está de pé (não depende de terceiros). */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /** Readiness: dependências críticas respondem. */
  @Get('ready')
  async ready() {
    const [db, cache] = await Promise.allSettled([this.prisma.$queryRaw`SELECT 1`, this.redis.ping()]);
    const result = { db: db.status === 'fulfilled', redis: cache.status === 'fulfilled' };
    if (!result.db || !result.redis) throw new ServiceUnavailableException(result);
    return { status: 'ok', ...result };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
