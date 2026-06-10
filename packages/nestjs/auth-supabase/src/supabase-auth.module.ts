import { type DynamicModule, Module } from "@nestjs/common";
import { ACCESS_TOKEN_VERIFIER } from "@repo/nestjs-auth";
import { SUPABASE_JWT_OPTIONS, SupabaseVerifier } from "./supabase-verifier.js";

export interface SupabaseAuthOptions {
  /** 신형 프로젝트 (ECC P-256): supabaseUrl 만 넘기면 JWKS 자동 조회 */
  supabaseUrl?: string;
  /** 레거시 프로젝트 (HS256): 대칭 시크릿 */
  jwtSecret?: string;
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
