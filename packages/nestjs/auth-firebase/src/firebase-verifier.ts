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
    const role = (decoded["role"] as string | undefined) ?? "user";
    let orgId = (decoded[ACTIVE_ORG_CLAIM] as string | undefined) ?? null;

    if (!orgId && this.provision) {
      const { orgId: newOrgId, orgRole } = await this.provision.provisionFromProvider(uid, email);
      orgId = newOrgId;
      await getAuth(this.app).setCustomUserClaims(uid, {
        [ACTIVE_ORG_CLAIM]: orgId,
        org_role: orgRole,
      });
    }

    return { sub: uid, role, orgId };
  }
}
