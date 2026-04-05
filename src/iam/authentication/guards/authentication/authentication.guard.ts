import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTH_TYPE, AuthType } from "src/common/decorators/auth.decorator";
import { AccessTokenGuard } from "../access-token.guard";
import { ApiKeyGuard } from "../api-key/api-key.guard";

@Injectable()
export class AuthenticationGuard implements CanActivate {
  public static defaultAuthTypeGuard: CanActivate = { canActivate: () => true };
  private readonly authTypeGuardMap: Record<AuthType, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Jwt]: this.accessTokenGuard,
      [AuthType.ApiKey]: this.apiKeyGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

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
    const errorMessages: string[] = [];
    const guards = authTypes.map((type) => this.authTypeGuardMap[type]);
    for (const guard of guards) {
      try {
        const canActivate = await guard.canActivate(context);
        if (canActivate) return true;
      } catch (err) {
        errorMessages.push(
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
    throw new UnauthorizedException(errorMessages.join(" || "));
  }
}
