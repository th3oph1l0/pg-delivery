import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 2,
      enableAutoPipelining: true,
      lazyConnect: false,
    });
  }

  /** Cache-aside com proteção simples contra stampede (lock SET NX). */
  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached) as T;

    const lockKey = `lock:${key}`;
    const gotLock = await this.set(lockKey, '1', 'EX', 10, 'NX');
    if (!gotLock) {
      await new Promise((r) => setTimeout(r, 75));
      const retry = await this.get(key);
      if (retry) return JSON.parse(retry) as T;
    }
    try {
      const value = await loader();
      await this.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return value;
    } finally {
      if (gotLock) await this.del(lockKey);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}

@Global()
@Module({ providers: [RedisService], exports: [RedisService] })
export class RedisModule {}
