import { Inject, Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import type { AccessTokenVerifier, VerifiedIdentity } from "@repo/nestjs-auth";
import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { FIREBASE_PROVISION_PORT, type FirebaseProvisionPort } from "./firebase-provision-port.js";

export const FIREBASE_ADMIN_APP = Symbol("FIREBASE_ADMIN_APP");

@Injectable()
export class FirebaseVerifier implements AccessTokenVerifier {
  constructor(
    @Inject(FIREBASE_ADMIN_APP) private readonly app: App,
    @Optional()
    @Inject(FIREBASE_PROVISION_PORT)
    private readonly provision: FirebaseProvisionPort | null,
  ) {}

  async verify(token: string): Promise<VerifiedIdentity> {
    let decoded: Awaited<ReturnType<ReturnType<typeof getAuth>["verifyIdToken"]>>;
    try {
      decoded = await getAuth(this.app).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException("invalid firebase token");
    }

    const { uid, email = "" } = decoded;
    const role = (decoded.role as string | undefined) ?? "user";
    let orgId = (decoded[ACTIVE_ORG_CLAIM] as string | undefined) ?? null;
    let orgRole: string | null = null;
    // Firebase UID는 UUID가 아니므로 internal UUID로 교체. provision 없으면 uid 그대로 사용.
    let sub = uid;

    if (!orgId && this.provision) {
      // active_org 없음 → 개인 org 프로비저닝(멤버 보장).
      const provisioned = await this.provision.provisionFromProvider(uid, email);
      orgId = provisioned.orgId;
      orgRole = provisioned.orgRole ?? null;
      sub = provisioned.internalUserId;
      await getAuth(this.app).setCustomUserClaims(uid, {
        [ACTIVE_ORG_CLAIM]: orgId,
        org_role: orgRole,
      });
    } else if (orgId) {
      // active_org 클레임은 멤버십 검증 후에만 신뢰 — 비멤버면 fail-close(spec-26-04 A).
      // 검증 수단(provision 포트) 부재 시도 클레임 불신 → fail-close(포트 미배선 silent fail-OPEN 방지).
      const membership = this.provision ? await this.provision.getOrgMembership(uid, orgId) : null;
      if (membership) {
        orgRole = membership.orgRole;
      } else {
        orgId = null;
      }
    }

    return { sub, role, orgId, orgRole };
  }
}
