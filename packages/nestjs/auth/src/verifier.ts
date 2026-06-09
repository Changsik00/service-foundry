import { UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM, verifyAccessToken } from "@repo/backend-auth-jwt";

import type { NestjsAuthOptions } from "./auth.guard.js";

export type VerifiedIdentity = {
  sub: string;
  /** raw string — 호출자(AuthGuard)가 Role.safeParse 로 검증 */
  role: string;
  orgId: string | null;
};

export interface AccessTokenVerifier {
  verify(token: string): Promise<VerifiedIdentity>;
}

export const ACCESS_TOKEN_VERIFIER = Symbol("ACCESS_TOKEN_VERIFIER");

export class NativeVerifier implements AccessTokenVerifier {
  constructor(private readonly opts: NestjsAuthOptions) {}

  // biome-ignore lint/correctness/noUnusedVariables: stub — Task 2에서 구현
  async verify(_token: string): Promise<VerifiedIdentity> {
    throw new Error("NativeVerifier.verify: not implemented");
  }
}
