import type { KeyStore } from "@repo/backend-auth-jwt";

export const NESTJS_AUTH_OPTIONS = Symbol("NESTJS_AUTH_OPTIONS");

export interface NestjsAuthOptions {
  /** `KeyStore` 인스턴스 또는 lazy getter. onModuleInit 이후 호출이 보장될 때 lazy 사용. */
  keyStore: KeyStore | (() => KeyStore);
  issuer: string;
  audience: string;
}
