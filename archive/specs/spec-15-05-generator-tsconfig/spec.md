# spec-15-05: 생성기 tsconfig 정합 (backend types:["node"])

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-15-05` |
| **Phase** | `phase-15` |
| **Branch** | `spec-15-05-generator-tsconfig` |
| **상태** | Planning |
| **타입** | Fix (생성기 정합) |
| **Integration Test Required** | no (생성 후 typecheck 로 수동 검증) |
| **작성일** | 2026-06-01 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`turbo gen`(`pnpm new`) 의 패키지 생성기 `turbo/generators/lib/templates.ts` 의 `tsconfig()` 는 카테고리별 compilerOptions 를 다음과 같이 생성한다:
- `shared`: `{ lib: ["ES2023","DOM"] }`
- 그 외(backend 포함): `undefined` (compilerOptions 없음, `extends` + `include` 만)

backend 는 `tsconfigExtends = @repo/typescript-config/base` (`base.json`)를 extends 하는데, `base.json` 에는 `types:["node"]` 가 **없다**(`lib:["ES2023"]` 만). 결과적으로 **생성된 backend 패키지 tsconfig 에 node 타입이 없어** `console`/`process` 등 Node 전역 사용 시 typecheck 가 실패한다.

### 문제점
- phase-15 성공기준5 미충족: "`pnpm new package`(backend) 가 `types:["node"]` 포함 tsconfig 생성, 신규 패키지가 console/process 사용해도 typecheck PASS".
- 신규 backend 패키지 생성 직후 개발자가 즉시 typecheck 깨짐을 만남(DX 저하). spec-15-01 task-08 에서 식별·이관된 항목.

### 해결 방안 (요약)
`tsconfig()` 템플릿이 **backend** 카테고리에 `compilerOptions.types = ["node"]` 를 포함하도록 교정한다. nestjs(`@repo/typescript-config/nestjs` = types:[node])·frontend(react = DOM) 는 preset 으로 이미 충족이라 변경 없음. 템플릿 단위 테스트 추가 + 임시 backend 패키지 생성→console 사용→typecheck PASS 로 검증.

## 🎯 요구사항

### Functional Requirements
1. 생성된 **backend** 패키지 tsconfig 가 `compilerOptions.types: ["node"]` 포함.
2. `shared`(lib ES2023+DOM)·`frontend`(react preset)·`nestjs`(nestjs preset = node) 동작 불변.
3. `config` 카테고리는 tsconfig 생성 안 함(기존) 불변.

### Non-Functional Requirements
1. 생성기 다른 산출물(package.json/src/vitest 등) 불변 — tsconfig 템플릿만 교정.
2. 템플릿 단위 테스트로 카테고리별 tsconfig 출력 회귀 고정.

## 🚫 Out of Scope
- `base.json`/`library.json` 등 preset 자체 수정(수동 생성 패키지 영향) — 생성기 템플릿 한정.
- shared 의 DOM 포함 적절성 재검토 — 기존 동작 유지.
- 생성기 테스트를 `turbo run test`(CI) 에 편입 — 별 항목(생성기는 패키지 아님).

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (생성기 템플릿 버그 fix)

## 🔗 관련 문서 (Related)
- 관련: `docs/review/2026-06-01-wiring-audit.md` §E, spec-15-01 task-08(이관)
- 관련 모듈: `turbo/generators/lib/templates.ts`, `packages/config/typescript-config/{base,nestjs,node-app}.json`

## ✅ Definition of Done
- [ ] `tsconfig()` 템플릿 backend → `types:["node"]`
- [ ] 템플릿 단위 테스트(카테고리별 tsconfig 출력)
- [ ] 임시 backend 패키지 생성 → console/process typecheck PASS 확인(후 정리)
- [ ] walkthrough/pr_description ship + push + PR (base: phase-15)
