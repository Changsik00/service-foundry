import { Inject, Injectable, Optional } from "@nestjs/common";
import type { AccessTokenVerifier, VerifiedIdentity } from "@repo/nestjs-auth";
import { SUPABASE_PROVISION_PORT, type SupabaseProvisionPort } from "./supabase-provision-port.js";

export const SUPABASE_JWT_OPTIONS = Symbol("SUPABASE_JWT_OPTIONS");

export interface SupabaseJwtOptions {
  jwtSecret: string;
}

@Injectable()
export class SupabaseVerifier implements AccessTokenVerifier {
  constructor(
    @Inject(SUPABASE_JWT_OPTIONS) readonly _opts: SupabaseJwtOptions,
    @Optional()
    @Inject(SUPABASE_PROVISION_PORT)
    readonly _provision: SupabaseProvisionPort | null,
  ) {}

  async verify(_token: string): Promise<VerifiedIdentity> {
    throw new Error("not implemented");
  }
}
