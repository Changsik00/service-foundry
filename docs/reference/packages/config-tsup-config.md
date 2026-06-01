---
type: reference
aliases: ["@repo/tsup-config", "tsup 빌드 프리셋"]
tags: [service-foundry, reference, config, tsup]
---

# @repo/tsup-config — Node 라이브러리 패키지용 tsup 빌드 프리셋

> 💡 **한 줄 요약**: ESM 전용 Node 라이브러리 빌드 설정을 `nodeLibPreset` 팩토리 함수로 제공하는 tsup 프리셋.
> **위치**: `packages/config/tsup-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

`packages/backend/*`, `packages/shared/*` 등 Node 런타임 라이브러리 패키지가 공통 tsup 옵션을 재사용할 수 있도록 `nodeLibPreset` 팩토리 함수를 제공한다. `Partial<Options>` overrides 를 받아 패키지별 entry·format 커스터마이징을 허용하며, ADR-0004 에 따른 ESM-only, Node22 타깃, DTS/sourcemap 생성을 기본값으로 고정한다.

## 제공 preset / export

| export | 파일 | 설명 |
|---|---|---|
| `./node-lib` | `src/node-lib.ts` | `nodeLibPreset(overrides?)` 팩토리 함수 |

`nodeLibPreset` 기본값:

| 옵션 | 값 | 비고 |
|---|---|---|
| `entry` | `["src/index.ts"]` | 단일 진입점 |
| `format` | `["esm"]` | ESM only (ADR-0004) |
| `target` | `"node22"` | Node 22 LTS |
| `dts` | `true` | `.d.ts` 생성 |
| `sourcemap` | `true` | 디버그용 소스맵 |
| `clean` | `true` | 빌드 전 dist 정리 |
| `splitting` | `false` | 코드 스플리팅 비활성 |
| `treeshake` | `true` | dead code 제거 |
| `minify` | `false` | 라이브러리는 미압축 |

## 의존

- 내부: 없음
- 외부: `tsup` (peer — 호출 패키지가 설치, [[stack]])

## 사용 예

```ts
// packages/backend/auth-session/tsup.config.ts
import { nodeLibPreset } from "@repo/tsup-config/node-lib";

export default nodeLibPreset();

// entry 또는 포맷 오버라이드
export default nodeLibPreset({ entry: ["src/index.ts", "src/cli.ts"] });
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 빌드 파이프라인
- [[adr/0004-typescript-and-compilation-strategy|ADR-0004]] — TypeScript·컴파일 전략 (ESM-only 결정)
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/tsup-config/src/node-lib.ts`
