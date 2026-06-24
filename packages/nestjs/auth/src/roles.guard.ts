import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { Reflector } from "@nestjs/core";

import { checkRoles } from "./roles-guard.util.js";

export const ROLES_KEY = "nestjs_auth:roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    return checkRoles(ctx, this.reflector, ROLES_KEY, (u) => u.role, "insufficient role");
  }
}
