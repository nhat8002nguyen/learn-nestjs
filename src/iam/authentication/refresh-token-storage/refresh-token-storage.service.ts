import { Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { CacheService } from "src/cache/cache.service";
import jwtConfig from "../config/jwt.config";

const KEY_PREFIX = "refresh-token:";

@Injectable()
export class RefreshTokenStorage {
  constructor(
    private readonly cache: CacheService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  private key(refreshTokenId: string) {
    return `${KEY_PREFIX}${refreshTokenId}`;
  }

  async save(refreshTokenId: string, userId: number): Promise<void> {
    await this.cache.set(
      this.key(refreshTokenId),
      String(userId),
      this.jwtConfiguration.refreshTokenExpiresIn,
    );
  }

  /**
   * Returns the user id if the refresh id exists, and removes the record (single use).
   */
  async validateAndConsume(refreshTokenId: string): Promise<number | null> {
    const raw = await this.cache.getDel(this.key(refreshTokenId));
    if (raw === null) {
      return null;
    }
    const userId = Number(raw);
    return Number.isFinite(userId) ? userId : null;
  }

  async revoke(refreshTokenId: string): Promise<void> {
    await this.cache.del(this.key(refreshTokenId));
  }
}
