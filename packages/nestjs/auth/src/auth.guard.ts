import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@repo/auth-contracts";
import type { KeyStore } from "@repo/backend-auth-jwt";

import { ACCESS_TOKEN_VERIFIER, type AccessTokenVerifier } from "./verifier.js";

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

    req.user = { sub: identity.sub, role: roleResult.data, orgId: identity.orgId };
    return true;
  }
}
