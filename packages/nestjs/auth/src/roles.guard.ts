import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { Reflector } from "@nestjs/core";
import type { Role } from "@repo/auth-contracts";

import type { AuthenticatedUser } from "./auth.guard.js";

export const ROLES_KEY = "nestjs_auth:roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!roles || roles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenException("insufficient role");
    }
    return true;
  }
}
