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
  constructor(private readonly reflector: Reflector) {
    // reflector used in canActivate — needed for NestJS DI
    void this.reflector;
  }

  canActivate(_ctx: ExecutionContext): boolean {
    throw new ForbiddenException("not implemented");
  }
}

// placeholder — will be removed after Green
export type _OrgRoleRef = OrgRole;
export type _AuthUserRef = AuthenticatedUser;
