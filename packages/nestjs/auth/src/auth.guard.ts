import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { OrgRole, Role } from "@repo/auth-contracts";

import { NESTJS_AUTH_OPTIONS, type NestjsAuthOptions } from "./options.js";
import { ACCESS_TOKEN_VERIFIER, type AccessTokenVerifier } from "./verifier.js";

export { NESTJS_AUTH_OPTIONS, type NestjsAuthOptions };

export type AuthenticatedUser = {
  sub: string;
  role: Role;
  orgId: string | null;
  orgRole: OrgRole | null;
};

function extractBearer(headers: Record<string, string | undefined>): string | null {
  const auth = headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(ACCESS_TOKEN_VERIFIER) private readonly verifier: AccessTokenVerifier) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user: AuthenticatedUser | undefined;
    }>();

    const token = extractBearer(req.headers);
    if (!token) throw new UnauthorizedException("missing token");

    const identity = await this.verifier.verify(token);

    // role / orgId 는 *검증된 claim*(identity)에서만 읽는다 — decodeJwt(미검증) 우회 금지.
    const roleResult = Role.safeParse(identity.role);
    if (!roleResult.success) throw new UnauthorizedException("missing or invalid role claim");

    // orgRole 도 런타임 검증 (We, spec-24-02): null 은 그대로, 비-null 인데 enum 외 값이면
    // null 폴백(fail-closed) — 위조/손상 orgRole 이 org 스코프 권한을 얻지 못하게 한다.
    const orgRole =
      identity.orgRole == null ? null : (OrgRole.safeParse(identity.orgRole).data ?? null);

    req.user = {
      sub: identity.sub,
      role: roleResult.data,
      orgId: identity.orgId,
      orgRole,
    };
    return true;
  }
}
