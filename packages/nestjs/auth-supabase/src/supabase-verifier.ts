import { Inject, Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import type { AccessTokenVerifier, VerifiedIdentity } from "@repo/nestjs-auth";
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";
import { SUPABASE_PROVISION_PORT, type SupabaseProvisionPort } from "./supabase-provision-port.js";

export const SUPABASE_JWT_OPTIONS = Symbol("SUPABASE_JWT_OPTIONS");

export interface SupabaseJwtOptions {
  /** 신형 프로젝트 (ECC P-256 / ES256): JWKS 엔드포인트로 공개키 자동 조회 */
  supabaseUrl?: string;
  /** 레거시 프로젝트 (HS256): 대칭 시크릿으로 직접 검증 */
  jwtSecret?: string;
}

@Injectable()
export class SupabaseVerifier implements AccessTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;

  constructor(
    @Inject(SUPABASE_JWT_OPTIONS) private readonly opts: SupabaseJwtOptions,
    @Optional()
    @Inject(SUPABASE_PROVISION_PORT)
    private readonly provision: SupabaseProvisionPort | null,
  ) {
    this.jwks = opts.supabaseUrl
      ? createRemoteJWKSet(new URL(`${opts.supabaseUrl}/auth/v1/.well-known/jwks.json`))
      : null;
  }

  async verify(token: string): Promise<VerifiedIdentity> {
    let payload: JWTPayload;
    try {
      if (this.jwks) {
        ({ payload } = await jwtVerify(token, this.jwks));
      } else if (this.opts.jwtSecret) {
        const secret = new TextEncoder().encode(this.opts.jwtSecret);
        ({ payload } = await jwtVerify(token, secret));
      } else {
        throw new Error("supabaseUrl 또는 jwtSecret 중 하나는 필수입니다.");
      }
    } catch (err) {
      throw new UnauthorizedException("invalid supabase token");
    }

    const providerUid = payload.sub ?? "";
    const email = (payload.email as string | undefined) ?? "";
    // Supabase role 클레임 ("authenticated" | "service_role") → 내부 Role 매핑
    const supabaseRole = (payload.role as string | undefined) ?? "";
    const role = supabaseRole === "service_role" ? "admin" : "user";
    const appMeta = payload.app_metadata as Record<string, unknown> | undefined;

    let orgId =
      (payload[ACTIVE_ORG_CLAIM] as string | undefined) ??
      (appMeta?.[ACTIVE_ORG_CLAIM] as string | undefined) ??
      null;
    let orgRole: string | null = null;
    // sub 는 모드 무관 내부 users.id 로 정규화(spec-x-auth-sub-normalize). provision 미배선 시 providerUid 폴백.
    let sub = providerUid;

    if (!orgId && this.provision) {
      // active_org 없음 → 개인 org 프로비저닝(멤버 보장) + 내부 id 획득.
      const provisioned = await this.provision.provisionFromProvider(providerUid, email);
      orgId = provisioned.orgId;
      orgRole = provisioned.orgRole ?? null;
      sub = provisioned.internalUserId;
    } else if (orgId && this.provision) {
      // active_org 클레임은 멤버십 검증 후에만 신뢰 — 비멤버면 fail-close(spec-26-04 A).
      const membership = await this.provision.getOrgMembership(providerUid, orgId);
      if (membership) {
        orgRole = membership.orgRole;
        sub = membership.internalUserId;
      } else {
        orgId = null;
        sub = (await this.provision.resolveInternalUserId(providerUid)) ?? providerUid;
      }
    } else if (orgId) {
      // provision 미배선 + claim → 검증 불가, fail-close (26-04 S3: silent fail-OPEN 방지).
      orgId = null;
    }

    return { sub, role, orgId, orgRole };
  }
}
