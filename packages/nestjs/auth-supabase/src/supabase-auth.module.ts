import { type DynamicModule, Module } from "@nestjs/common";
import { ACCESS_TOKEN_VERIFIER } from "@repo/nestjs-auth";
import { SUPABASE_JWT_OPTIONS, SupabaseVerifier } from "./supabase-verifier.js";

export interface SupabaseAuthOptions {
  jwtSecret: string;
}

@Module({})
export class NestjsSupabaseAuthModule {
  static forRoot(opts: SupabaseAuthOptions): DynamicModule {
    return {
      module: NestjsSupabaseAuthModule,
      providers: [
        { provide: SUPABASE_JWT_OPTIONS, useValue: opts },
        SupabaseVerifier,
        { provide: ACCESS_TOKEN_VERIFIER, useExisting: SupabaseVerifier },
      ],
      exports: [ACCESS_TOKEN_VERIFIER],
    };
  }
}
