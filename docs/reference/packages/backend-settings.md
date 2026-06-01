---
type: reference
aliases: ["@repo/backend-settings", "환경 변수 설정 스키마"]
tags: [service-foundry, reference, backend, config]
---

# @repo/backend-settings — Backend 공통 환경 변수 설정 진입점

> 💡 **한 줄 요약**: `@env-kit/node-settings`와 Zod 기반 `BaseBackendSchema`를 re-export하고 config 마스킹 유틸리티를 제공하는 framework-agnostic 설정 패키지.
> **위치**: `packages/backend/settings` · **상위**: [[architecture]]

## 책임 (Responsibility)

`BaseBackendSchema`(`NODE_ENV`, `PORT`, `LOG_LEVEL`)를 공통 기반으로 제공하며, 각 앱은 `.extend()`로 확장한다. `defineSettings`/`introspectEnvSchema` 등 `@env-kit/node-settings` 풍부한 API를 re-export한다. `maskConfig`로 로그 출력 시 민감 키를 마스킹한다. NestJS DI 어댑터는 `@repo/nestjs-settings`(ADR-0015).

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `BaseBackendSchema` | const | 공통 최소 env Zod 스키마 |
| `BaseBackendInput` | type | 스키마 입력 타입 |
| `BaseBackendOutput` | type | 스키마 출력 타입 |
| `defineSettings` | fn | 설정 정의 헬퍼 (env-kit re-export) |
| `introspectEnvSchema` | fn | 스키마 내성·문서화 (env-kit re-export) |
| `NodeSettingsError` | class | 설정 오류 클래스 (env-kit re-export) |
| `presets` | const | 환경별 기본값 프리셋 |
| `DEFAULT_DOCS_BASE` | const | 문서 기본 URL |
| `DEFAULT_SECRET_PATTERNS` | const | 기본 시크릿 패턴 |
| `maskConfig` | fn | 설정 객체 민감 키 마스킹 |
| `MASK` | const | 마스킹 플레이스홀더 문자열 |
| `MaskOptions` | type | 마스킹 옵션 타입 |
| `DEFAULT_REDACT_KEYS` | const | 기본 레댁션 키 목록 |
| `DEFAULT_REDACT_SUBSTRINGS` | const | 기본 레댁션 부분 문자열 목록 |

## 의존

- 내부: [[shared-errors]] (`@repo/errors`), [[shared-utils]] (`@repo/utils`)
- 외부: `@env-kit/node-settings` (풍부한 env 설정 API), `zod` (스키마 검증)

## 사용 예

```ts
import { BaseBackendSchema, defineSettings, maskConfig } from "@repo/backend-settings";
import { z } from "zod";

const AppSchema = BaseBackendSchema.extend({
  DATABASE_URL: z.string().url(),
});
const settings = defineSettings(AppSchema, process.env);
console.log(maskConfig(settings)); // DATABASE_URL → [REDACTED]
```

## 연결된 개념

- [[adr/0005-backend-framework-and-orm-strategy]] — 설정 관리 전략 결정
- [[backend-secrets]] — runtime secret 접근과의 역할 구분
- [[backend-logger]] — LOG_LEVEL 설정 소비

> 소스: spec-03-01 · `packages/backend/settings/src/`
