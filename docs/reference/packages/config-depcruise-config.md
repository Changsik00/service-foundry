---
type: reference
aliases: ["@repo/depcruise-config", "dependency-cruiser 설정 프리셋"]
tags: [service-foundry, reference, config, depcruise]
---

# @repo/depcruise-config — monorepo 레이어 경계 의존성 검사 프리셋

> 💡 **한 줄 요약**: dependency-cruiser 가 강제하는 레이어 간 금지 규칙(순환·고아·계층 위반)을 중앙화한 CJS 프리셋.
> **위치**: `packages/config/depcruise-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

`dependency-cruiser` 의 `forbidden` 규칙과 `options` 를 `base.cjs` 에 집약하여 모든 워크스페이스 패키지가 동일한 아키텍처 경계를 강제하도록 한다. config-pure(설정 패키지 격리), shared-no-backend, frontend-no-backend, nestjs-no-frontend 등 ADR-0015 에서 정의한 tier 분리 규칙을 포함한다.

> ⚠️ dependency-cruiser 는 `require()` 로 설정 파일을 로드하므로 ESM 워크스페이스 내에서도 **CJS**(`base.cjs`) 포맷으로 배포된다.

## 제공 preset / export

| export | 파일 | 설명 |
|---|---|---|
| `./base` | `base.cjs` | forbidden 규칙 + enhancedResolveOptions + exclude 설정 |

주요 금지 규칙:

| 규칙 이름 | 심각도 | 내용 |
|---|---|---|
| `no-circular` | error | 순환 의존 금지 |
| `no-orphans` | warn | 고아 파일(dead code) 경고 |
| `packages-no-app-imports` | error | `packages/*` → `apps/*` 금지 |
| `shared-no-backend-imports` | error | `packages/shared/*` → `packages/backend/*` 금지 |
| `frontend-no-backend-imports` | error | `packages/frontend/*` → `packages/backend/*` 금지 |
| `config-pure` | error | `packages/config/*` → 비config 내부 패키지 금지 |
| `backend-no-nestjs-imports` | error | backend tier 는 NestJS 어댑터 의존 금지 |
| `frontend-no-react-adapter-imports` | error | frontend tier 는 react 어댑터 의존 금지 |
| `nestjs-no-frontend-imports` | error | NestJS 어댑터 → browser tier 금지 |
| `react-no-backend-imports` | error | React 어댑터 → server tier 금지 |

## 의존

- 내부: 없음
- 외부: `dependency-cruiser` (peer — 호출 패키지가 설치, [[stack]])

## 사용 예

```js
// 각 패키지 .dependency-cruiser.cjs
const base = require("@repo/depcruise-config/base");

module.exports = {
  ...base,
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 레이어 구조 및 tier 경계
- [[adr/0001-linting-formatting-strategy|ADR-0001]] — 정적 분석 전략
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃
- [[adr/0015-framework-adapter-naming-and-layout|ADR-0015]] — 어댑터 tier 분리

> 소스: spec-01-02 · `packages/config/depcruise-config/base.cjs`
