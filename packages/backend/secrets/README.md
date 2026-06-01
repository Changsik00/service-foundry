# @repo/backend-secrets

> `process.env` 직접 결합을 제거하고 Vault·AWS Secrets Manager 등으로 교체 가능한 `SecretsProvider` 포트와 env/인메모리 어댑터를 제공한다.

## 설치 / import
```ts
import { createEnvSecrets, createMemorySecrets } from "@repo/backend-secrets";
```

## 핵심 API
- `createEnvSecrets()` — `process.env` 기반 어댑터 팩토리
- `createMemorySecrets(map)` — 테스트 주입용 인메모리 어댑터 팩토리
- `provider.require(key)` — 없으면 `AppError(INTERNAL)` throw, 구성 오류 조기 감지
- `provider.get(key)` — 없으면 `null` 반환

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-secrets.md`](../../../docs/reference/packages/backend-secrets.md)
- 동작 원리: [`docs/explainers/backend/secrets-provider-port.md`](../../../docs/explainers/backend/secrets-provider-port.md)
