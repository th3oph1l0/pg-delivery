import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Request } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { RedisService } from '../infrastructure/redis/redis.service';

/**
 * Exige Idempotency-Key e devolve a mesma resposta para repetições (24 h).
 * Mesmo key + corpo diferente → 409.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: { sub: string } }>();
    const key = req.header('idempotency-key');
    if (!key || !/^[\w-]{16,64}$/.test(key)) {
      throw new BadRequestException('Header Idempotency-Key obrigatório (16–64 caracteres)');
    }
    const fingerprint = createHash('sha256').update(JSON.stringify(req.body ?? {})).digest('hex');
    const redisKey = `idem:${req.user?.sub ?? 'anon'}:${req.method}:${req.path}:${key}`;

    return from(this.redis.get(redisKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          const { fp, body } = JSON.parse(cached) as { fp: string; body: unknown };
          if (fp !== fingerprint) throw new ConflictException('Idempotency-Key reutilizada com outro corpo');
          return of(body);
        }
        return next.handle().pipe(
          tap((body) => void this.redis.set(redisKey, JSON.stringify({ fp: fingerprint, body }), 'EX', 86_400)),
        );
      }),
    );
  }
}
