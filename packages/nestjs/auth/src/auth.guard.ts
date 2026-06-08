import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@repo/auth-contracts";
import type { KeyStore } from "@repo/backend-auth-jwt";
import { ACTIVE_ORG_CLAIM, verifyAccessToken } from "@repo/backend-auth-jwt";

export const NESTJS_AUTH_OPTIONS = Symbol("NESTJS_AUTH_OPTIONS");

export interface NestjsAuthOptions {
  /** `KeyStore` 인스턴스 또는 lazy getter. onModuleInit 이후 호출이 보장될 때 lazy 사용. */
  keyStore: KeyStore | (() => KeyStore);
  issuer: string;
  audience: string;
}

export type AuthenticatedUser = {
  sub: string;
  role: Role;
  orgId: string | null;
};

function extractBearer(headers: Record<string, string | undefined>): string | null {
  const auth = headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(NESTJS_AUTH_OPTIONS) private readonly opts: NestjsAuthOptions) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user: AuthenticatedUser | undefined;
    }>();

    const token = extractBearer(req.headers);
    if (!token) throw new UnauthorizedException("missing token");

    const keyStore =
      typeof this.opts.keyStore === "function" ? this.opts.keyStore() : this.opts.keyStore;

    const result = await verifyAccessToken(token, keyStore, {
      issuer: this.opts.issuer,
      audience: this.opts.audience,
    });
    if (!result.ok) throw new UnauthorizedException(result.error.message);

    // role / orgId 는 *검증된 claim*(result.value)에서만 읽는다 — decodeJwt(미검증) 우회 금지.
    const roleResult = Role.safeParse(result.value.role);
    if (!roleResult.success) throw new UnauthorizedException("missing or invalid role claim");

    // activeOrgId 클레임 → req.user.orgId. 서명측과 동일 상수(ACTIVE_ORG_CLAIM)로 표류 차단.
    const claimOrgId = result.value[ACTIVE_ORG_CLAIM];
    const orgId = typeof claimOrgId === "string" ? claimOrgId : null;
    req.user = { sub: result.value.sub, role: roleResult.data, orgId };
    return true;
  }
}
