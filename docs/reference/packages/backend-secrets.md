---
type: reference
aliases: ["@repo/backend-secrets", "시크릿 제공자 포트"]
tags: [service-foundry, reference, backend, secrets]
---

# @repo/backend-secrets — Secret 접근 추상화 포트 + env/인메모리 어댑터

> 💡 **한 줄 요약**: `process.env` 직접 결합을 제거하고 Vault·AWS Secrets Manager 등으로 교체 가능한 `SecretsProvider` 포트와 env/인메모리 어댑터를 제공한다.
> **위치**: `packages/backend/secrets` · **상위**: [[architecture]]

## 책임 (Responsibility)

`SecretsProvider` 포트를 정의하여 secret 접근을 추상화한다. `get`은 없으면 `null`을 반환하고, `require`는 없으면 `AppError(INTERNAL)`을 throw하여 구성 오류를 조기에 감지한다. `createEnvSecrets`는 `process.env` 기반 어댑터, `createMemorySecrets`는 테스트 주입용 어댑터다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `SecretsProvider` | type | `get` + `require` 포트 인터페이스 |
| `createEnvSecrets` | fn | `process.env` 기반 어댑터 팩토리 |
| `createMemorySecrets` | fn | 테스트용 인메모리 어댑터 팩토리 |

## 의존

- 내부: [[shared-errors]] (`@repo/errors`)
- 외부: 없음

## 사용 예

```ts
import { createEnvSecrets, createMemorySecrets } from "@repo/backend-secrets";

// 프로덕션:
const secrets = createEnvSecrets();
const jwtSecret = await secrets.require("JWT_PRIVATE_KEY");

// 테스트:
const testSecrets = createMemorySecrets({ JWT_PRIVATE_KEY: "fake-key" });
const val = await testSecrets.get("JWT_PRIVATE_KEY");
```

## 연결된 개념

- [[explainers/backend/secrets-provider-port]] — 포트-어댑터 설계 및 원격 제공자 교체 전략
- [[backend-settings]] — 환경 변수 스키마 검증과의 조합
- [[backend-auth-jwt]] — JWT 키 로딩 시 secrets 소비 예시

> 소스: spec-14-05 · `packages/backend/secrets/src/`
