import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { AuthType, AUTH_TYPE } from "src/common/decorators/auth.decorator";
import type { AccessTokenPayload } from "../jwt/jwt.service";
import { JwtService } from "../jwt/jwt.service";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const raw = this.reflector.getAllAndOverride<AuthType | AuthType[]>(
      AUTH_TYPE,
      [context.getHandler(), context.getClass()],
    );
    const authTypes: AuthType[] =
      raw === undefined || raw === null
        ? [AuthType.Jwt]
        : Array.isArray(raw)
          ? raw
          : [raw];

    if (authTypes.length === 1 && authTypes[0] === AuthType.None) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.header("Authorization");

    if (!authorizationHeader) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new UnauthorizedException(
        "Authorization header must be in the format: Bearer <token>",
      );
    }

    const token = match[1];

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }

    // Expose the authenticated payload to handlers for downstream usage.
    (request as unknown as Record<string, unknown>).user = payload;
    return true;
  }
}
