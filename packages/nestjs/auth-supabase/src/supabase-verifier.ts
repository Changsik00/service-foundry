import { Inject, Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { ACTIVE_ORG_CLAIM } from "@repo/backend-auth-jwt";
import type { AccessTokenVerifier, VerifiedIdentity } from "@repo/nestjs-auth";
import { type JWTPayload, jwtVerify } from "jose";
import { SUPABASE_PROVISION_PORT, type SupabaseProvisionPort } from "./supabase-provision-port.js";

export const SUPABASE_JWT_OPTIONS = Symbol("SUPABASE_JWT_OPTIONS");

export interface SupabaseJwtOptions {
  jwtSecret: string;
}

@Injectable()
export class SupabaseVerifier implements AccessTokenVerifier {
  constructor(
    @Inject(SUPABASE_JWT_OPTIONS) private readonly opts: SupabaseJwtOptions,
    @Optional()
    @Inject(SUPABASE_PROVISION_PORT)
    private readonly provision: SupabaseProvisionPort | null,
  ) {}

  async verify(token: string): Promise<VerifiedIdentity> {
    let payload: JWTPayload;
    try {
      const secret = new TextEncoder().encode(this.opts.jwtSecret);
      ({ payload } = await jwtVerify(token, secret));
    } catch {
      throw new UnauthorizedException("invalid supabase token");
    }

    const sub = payload.sub ?? "";
    const email = (payload.email as string | undefined) ?? "";
    const role = (payload.role as string | undefined) ?? "user";
    const appMeta = payload.app_metadata as Record<string, unknown> | undefined;

    let orgId =
      (payload[ACTIVE_ORG_CLAIM] as string | undefined) ??
      (appMeta?.[ACTIVE_ORG_CLAIM] as string | undefined) ??
      null;

    if (!orgId && this.provision) {
      const { orgId: newOrgId } = await this.provision.provisionFromProvider(sub, email);
      orgId = newOrgId;
    }

    return { sub, role, orgId };
  }
}
