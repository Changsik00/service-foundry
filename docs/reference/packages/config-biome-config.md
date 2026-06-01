---
type: reference
aliases: ["@repo/biome-config", "biome 설정 프리셋"]
tags: [service-foundry, reference, config, biome]
---

# @repo/biome-config — monorepo 공용 Biome 린트·포맷 프리셋

> 💡 **한 줄 요약**: 전체 워크스페이스에서 동일한 린트·포맷 규칙을 보장하는 Biome `extends` 기반 프리셋.
> **위치**: `packages/config/biome-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

Biome 린터·포맷터 규칙을 하나의 `base.json` 에 중앙화하여 각 패키지가 중복 설정 없이 `extends` 로 재사용할 수 있게 한다. 포맷 규칙(들여쓰기 2칸, 줄 너비 100, LF), 린트 규칙(`useImportType`, `noConsole` 등), NestJS 어댑터 overrides(정적 전용 클래스 허용)를 통합 관리한다.

## 제공 preset / export

| export | 파일 | 설명 |
|---|---|---|
| `./base` | `base.json` | Biome 전역 프리셋 — formatter + linter + overrides |

주요 설정:

- **포맷**: space 들여쓰기, 너비 100, LF, 쌍따옴표, trailing commas, 세미콜론 항상
- **린트**: `recommended: true` + `useImportType/useExportType: error`, `noConsole: warn` (error/warn/info 허용), `noExplicitAny: warn`
- **overrides**: `packages/nestjs/**/src/**` → `noStaticOnlyClass: off`
- **VCS**: `.gitignore` 적용, dist/.turbo/.next/coverage/CSS 제외

## 의존

- 내부: 없음
- 외부: `@biomejs/biome` (peer — 호출 패키지가 설치, [[stack]])

## 사용 예

```json
// 각 패키지 biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.4.15/schema.json",
  "extends": ["@repo/biome-config/base"]
}
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 레이어 구조
- [[adr/0001-linting-formatting-strategy|ADR-0001]] — Biome 채택 근거
- [[adr/0003-package-layout-and-naming|ADR-0003]] — config 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/biome-config/base.json`
