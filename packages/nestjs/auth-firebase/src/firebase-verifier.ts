import { Inject, Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import type { AccessTokenVerifier, VerifiedIdentity } from "@repo/nestjs-auth";
import type { App } from "firebase-admin/app";
import type { DecodedIdToken } from "firebase-admin/auth";
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
    throw new Error("not implemented");
  }
}
