---
type: reference
aliases: ["@repo/vitest-config", "vitest 테스트 프리셋"]
tags: [service-foundry, reference, config, vitest]
---

# @repo/vitest-config — Node·React 패키지용 Vitest 테스트 프리셋

> 💡 **한 줄 요약**: Node(백엔드)와 React(프론트엔드) 두 환경의 Vitest 설정을 각각 `nodePreset`/`reactPreset` 으로 제공하는 프리셋.
> **위치**: `packages/config/vitest-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

패키지 유형에 따라 적합한 테스트 환경(node vs jsdom)과 커버리지 설정을 표준화한다. `nodePreset` 은 CI 환경에서 crypto(argon2/bcrypt)·NestJS 부트스트랩의 느린 초기화를 감안해 타임아웃을 30초로 확장하고, github-actions reporter 를 활성화한다. 두 프리셋 모두 v8 커버리지 provider 와 lcov 리포터를 기본으로 설정한다.

## 제공 preset / export

| export | 파일 | 환경 | 설명 |
|---|---|---|---|
| `./node` | `src/node.ts` | `node` | 백엔드·라이브러리 패키지용, CI 타임아웃 30s |
| `./react` | `src/react.ts` | `jsdom` | 프론트엔드·React 컴포넌트용 |

`nodePreset` 주요 설정:

| 옵션 | 기본값 | CI 값 |
|---|---|---|
| `environment` | `"node"` | — |
| `globals` | `false` | — |
| `testTimeout` | `10_000` ms | `30_000` ms |
| `hookTimeout` | `10_000` ms | `30_000` ms |
| `reporters` | `["default"]` | `["default", "github-actions"]` |
| coverage `provider` | `"v8"` | — |
| coverage `reporter` | `["text", "html", "lcov"]` | — |

`reactPreset` 주요 차이: `environment: "jsdom"`, `.{ts,tsx}` glob, CI 타임아웃 조정 없음.

## 의존

- 내부: 없음
- 외부: `vitest` (peer — 호출 패키지가 설치, [[stack]])

## 사용 예

```ts
// packages/backend/auth-session/vitest.config.ts
import { nodePreset } from "@repo/vitest-config/node";
export default nodePreset;
```

```ts
// packages/frontend/auth-react/vitest.config.ts
import { reactPreset } from "@repo/vitest-config/react";
export default reactPreset;
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 테스트 전략
- [[adr/0004-typescript-and-compilation-strategy|ADR-0004]] — 컴파일·테스트 환경 결정
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/vitest-config/src/`
