import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";
import { AuthType, AUTH_TYPE } from "src/common/decorators/auth.decorator";
import { IS_API_PUBLIC } from "src/common/decorators/public.decorator";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_API_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // If a route is explicitly marked as JWT-protected, we skip API_KEY checks
    // and let the AccessTokenGuard handle authentication.
    const authType = this.reflector.getAllAndOverride<AuthType>(AUTH_TYPE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (authType === AuthType.Jwt) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header("API_KEY");

    return apiKey === process.env.API_KEY;
  }
}
