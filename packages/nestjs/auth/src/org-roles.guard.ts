import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { Reflector } from "@nestjs/core";

import { checkRoles } from "./roles-guard.util.js";

export const ORG_ROLES_KEY = "nestjs_auth:org_roles";

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // orgRole 은 AuthGuard 에서 OrgRole | null 로 검증됨 (We, spec-24-02).
    return checkRoles(
      ctx,
      this.reflector,
      ORG_ROLES_KEY,
      (u) => u.orgRole,
      "insufficient org role",
    );
  }
}
