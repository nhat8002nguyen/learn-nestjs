import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ActiveUserData } from "src/iam/authentication/dto/active-user-data/active-user-data.dto";
import { Role } from "src/users/enums/role.enum";
import { Request } from "express";
import { ROLES_KEY } from "../../decorators/role.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: ActiveUserData }>();
    const user = request.user;
    return requiredRoles.some((role) => user.role === role);
  }
}
