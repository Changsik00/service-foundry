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

const STUB = "spec-14-05: secrets provider not implemented yet";

export function createEnvSecrets(
  _env: Record<string, string | undefined> = process.env,
): SecretsProvider {
  throw new Error(STUB);
}

export function createMemorySecrets(_map: Record<string, string>): SecretsProvider {
  throw new Error(STUB);
}

// AppError 참조 보존(Red 단계 unused import 방지) — 구현 단계에서 require 가 사용.
void AppError;
