import { type DynamicModule, Module } from "@nestjs/common";
import { ACCESS_TOKEN_VERIFIER } from "@repo/nestjs-auth";
import { SUPABASE_JWT_OPTIONS, SupabaseVerifier } from "./supabase-verifier.js";

export interface SupabaseAuthOptions {
  jwtSecret: string;
}

@Module({})
export class NestjsSupabaseAuthModule {
  static forRoot(_opts: SupabaseAuthOptions): DynamicModule {
    throw new Error("not implemented");
  }
}

export { ACCESS_TOKEN_VERIFIER, SUPABASE_JWT_OPTIONS, SupabaseVerifier };
