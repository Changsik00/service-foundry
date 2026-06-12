import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { Reflector } from "@nestjs/core";
import type { OrgRole } from "@repo/auth-contracts";

import type { AuthenticatedUser } from "./auth.guard.js";

export const ORG_ROLES_KEY = "nestjs_auth:org_roles";

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<OrgRole[] | undefined>(ORG_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!roles || roles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const orgRole = req.user?.orgRole ?? null;
    if (!orgRole || !roles.includes(orgRole as OrgRole)) {
      throw new ForbiddenException("insufficient org role");
    }
    return true;
  }
}
