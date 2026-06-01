---
type: reference
aliases: ["@repo/knip-config", "knip 미사용 코드 검사 프리셋"]
tags: [service-foundry, reference, config, knip]
---

# @repo/knip-config — monorepo 미사용 코드·의존성 탐지 프리셋

> 💡 **한 줄 요약**: Knip 이 워크스페이스별 entry/project 경로를 정확히 인식하도록 monorepo 구조를 선언한 JSON 프리셋.
> **위치**: `packages/config/knip-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

Knip dead code 분석기가 monorepo 의 각 워크스페이스 유형(config, shared, backend, frontend, apps)을 올바르게 이해할 수 있도록 `workspaces` 설정과 전역 `ignore` 패턴을 중앙화한다. 이를 통해 미사용 export·의존성·파일을 전체 저장소에서 일관되게 감지할 수 있다.

## 제공 preset / export

| export | 파일 | 설명 |
|---|---|---|
| `./base` | `base.json` | Knip workspaces + ignore 전역 설정 |

워크스페이스별 entry 설정:

| 워크스페이스 패턴 | entry | project |
|---|---|---|
| `.` (루트) | `packages/config/**/*.{ts,json}`, `tooling/scripts/**/*.ts` | `**/*.{ts,tsx}` |
| `packages/config/*` | `**/*.{ts,json}` | `**/*.{ts,json}` |
| `packages/shared/*` | `src/index.ts` | `src/**/*.ts` |
| `packages/backend/*` | `src/index.ts` | `src/**/*.ts` |
| `packages/frontend/*` | `src/index.{ts,tsx}` | `src/**/*.{ts,tsx}` |
| `apps/*` | `src/main.{ts,tsx}`, `src/server.ts` | `src/**/*.{ts,tsx}` |

`ignoreBinaries`: `lefthook` (CI hook runner — knip 탐지 제외)

## 의존

- 내부: 없음
- 외부: `knip` (peer — 루트 devDependency, [[stack]])

## 사용 예

```json
// 루트 knip.json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "extends": ["@repo/knip-config/base"]
}
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 워크스페이스 레이아웃
- [[adr/0001-linting-formatting-strategy|ADR-0001]] — 정적 분석 전략 (knip 포함)
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/knip-config/base.json`
