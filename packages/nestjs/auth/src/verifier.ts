import { UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, ORG_ROLE_CLAIM, verifyAccessToken } from "@repo/backend-auth-jwt";

import type { NestjsAuthOptions } from "./options.js";

export type VerifiedIdentity = {
  sub: string;
  /** raw string — 호출자(AuthGuard)가 Role.safeParse 로 검증 */
  role: string;
  orgId: string | null;
  orgRole: string | null;
};

export interface AccessTokenVerifier {
  verify(token: string): Promise<VerifiedIdentity>;
}

export const ACCESS_TOKEN_VERIFIER = Symbol("ACCESS_TOKEN_VERIFIER");

export class NativeVerifier implements AccessTokenVerifier {
  constructor(private readonly opts: NestjsAuthOptions) {}

  async verify(token: string): Promise<VerifiedIdentity> {
    const keyStore =
      typeof this.opts.keyStore === "function" ? this.opts.keyStore() : this.opts.keyStore;

    const result = await verifyAccessToken(token, keyStore, {
      issuer: this.opts.issuer,
      audience: this.opts.audience,
    });
    if (!result.ok) throw new UnauthorizedException(result.error.message);

    const { role, sub } = result.value;
    if (typeof role !== "string" || !role) {
      throw new UnauthorizedException("missing or invalid role claim");
    }

    const claimOrgId = result.value[ACTIVE_ORG_CLAIM];
    const orgId = typeof claimOrgId === "string" ? claimOrgId : null;

    const claimOrgRole = result.value[ORG_ROLE_CLAIM];
    const orgRole = typeof claimOrgRole === "string" ? claimOrgRole : null;

    return { sub, role, orgId, orgRole };
  }
}
