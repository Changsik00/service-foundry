/**
 * @repo/backend-secrets — secret 접근 추상화 포트 + env/in-memory 어댑터.
 *
 * process.env 직접 결합을 제거해 vault / AWS Secrets Manager 등으로 교체·테스트 주입 가능.
 * framework-agnostic (ADR-0015). 원격 어댑터는 후속.
 */
import { AppError } from "@repo/errors";

export interface SecretsProvider {
  /** key 의 secret — 없으면 null */
  get(key: string): Promise<string | null>;
  /** key 의 secret — 없으면 AppError(INTERNAL) throw (구성 오류) */
  require(key: string): Promise<string>;
}

function fromLookup(lookup: (key: string) => string | undefined): SecretsProvider {
  return {
    async get(key) {
      return lookup(key) ?? null;
    },
    async require(key) {
      const value = lookup(key);
      if (value === undefined || value === "") {
        // 필수 secret 부재 = 구성 오류 (ADR-0020: plain Error 금지).
        throw new AppError({
          code: "INTERNAL",
          message: `Required secret not configured: ${key}`,
          statusCode: 500,
        });
      }
      return value;
    },
  };
}

export function createEnvSecrets(
  env: Record<string, string | undefined> = process.env,
): SecretsProvider {
  return fromLookup((key) => env[key]);
}

export function createMemorySecrets(map: Record<string, string>): SecretsProvider {
  return fromLookup((key) => map[key]);
}
