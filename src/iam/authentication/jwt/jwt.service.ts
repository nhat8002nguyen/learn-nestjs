import { Inject, Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import type { ConfigType } from "@nestjs/config";
import jwtConfig from "../config/jwt.config";

export type AccessTokenPayload = { sub: number; email: string };

export type RefreshTokenPayload = {
  sub: number;
  tokenType: "refresh";
  jti: string;
};

@Injectable()
export class JwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  signAccessToken(payload: AccessTokenPayload) {
    return this.nestJwtService.signAsync(payload, {
      expiresIn: this.jwtConfiguration.accessTokenExpiresIn,
    });
  }

  signRefreshToken(payload: RefreshTokenPayload) {
    return this.nestJwtService.signAsync(payload, {
      expiresIn: this.jwtConfiguration.refreshTokenExpiresIn,
    });
  }

  verifyRefreshToken(token: string) {
    return this.nestJwtService.verifyAsync<RefreshTokenPayload>(token);
  }

  verifyAccessToken(token: string) {
    return this.nestJwtService.verifyAsync<AccessTokenPayload>(token);
  }
}
