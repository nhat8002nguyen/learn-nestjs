import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Atomically returns the value and removes the key (Redis 6.2+ GETDEL).
   * Used so refresh tokens are single-use without a race between GET and DEL.
   */
  async getDel(key: string): Promise<string | null> {
    try {
      const result = await this.redis.call("GETDEL", key);
      if (result === null || result === undefined) {
        return null;
      }
      if (typeof result === "string") {
        return result;
      }
      if (Buffer.isBuffer(result)) {
        return result.toString("utf8");
      }
      return null;
    } catch {
      const value = await this.redis.get(key);
      if (value !== null) {
        await this.redis.del(key);
      }
      return value;
    }
  }

  onModuleDestroy() {
    return this.redis.quit();
  }
}
