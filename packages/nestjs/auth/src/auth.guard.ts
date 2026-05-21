import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@repo/auth-contracts";
import type { KeyStore } from "@repo/backend-auth-jwt";
import { verifyAccessToken } from "@repo/backend-auth-jwt";
import { decodeJwt } from "jose";

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

    const decoded = decodeJwt(token);
    const roleResult = Role.safeParse(decoded.role);
    if (!roleResult.success) throw new UnauthorizedException("missing or invalid role claim");

    req.user = { sub: result.value.sub, role: roleResult.data };
    return true;
  }
}
