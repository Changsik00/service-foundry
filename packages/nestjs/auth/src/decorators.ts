import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Role } from "@repo/auth-contracts";

import type { AuthenticatedUser } from "./auth.guard.js";
import { ROLES_KEY } from "./roles.guard.js";

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined =>
    ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user,
);
