# Implementation Plan: spec-10-03

## 📋 Branch Strategy

- 신규 브랜치: `spec-10-03-tooling-scripts`
- 시작 지점: `phase-10-ops-tooling` (base, spec-10-02 머지 반영)
- base 모드: PR target = `phase-10-ops-tooling`
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **번들 spec** — manifest + startup-report + config-graph + security-linter 결정 (4건, 사용자 "공격적 번들" 결정).
> - [ ] **security-linter 는 결정 위주** — Go 시에만 최소 설정 추가, No-Go 면 근거 기록만.
> - [ ] **신규 의존 `yaml`** — service.yaml 파싱용 (catalog).

> [!WARNING]
> - [ ] startup-report 는 시크릿을 **절대 평문 출력 금지** — 마스킹 단위 테스트로 강제.
> - [ ] PreToolUse 훅 의존 중(#161) — 커밋은 add 분리 + bare `git commit`.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 스크립트 런타임 | `tsx` + root `pnpm tooling:*` | 레포 관례, 빌드 불필요 |
| 핵심 로직 | 순수 함수 분리(`tooling/scripts/<x>/lib`) | 단위 테스트 |
| yaml 파싱 | `yaml` (catalog) | service.yaml |
| 마스킹 | `@repo/backend-logger` redact 컨벤션 재사용 | 일관성 + 시크릿 보호 |
| config-graph | settings 스키마 → mermaid 필드 트리 | 풀 dep 그래프는 과함(Out of Scope) |
| security-linter | 3안 비교 → Go/No-Go ADR/노트 | 결정 위주, 범위 폭주 방지 |
| 테스트 | 순수함수 단위 + 통합 스모크(스크립트 실제 실행) | phase 시나리오 |

### 📑 ADR 후보

- [x] `security-linter-decision` (decision/tradeoff), `service-manifest-format` (convention) — 머지 시점 작성 검토.
- [ ] 없음

## 📂 Proposed Changes

### A. service-manifest
- [NEW] `apps/api/service.yaml`, `apps/web-next/service.yaml`, `apps/web-vite/service.yaml` (name/port/expose/depends)
- [NEW] `tooling/scripts/manifest/lib/validate.ts` — `validateManifests(list)` 순수 (스키마 + 포트중복 + depends 참조)
- [NEW] `tooling/scripts/manifest/lib/validate.test.ts`
- [NEW] `tooling/scripts/manifest/run.ts` — service.yaml glob 로드 → validate → 결과/exit

### B. startup-report
- [NEW] `tooling/scripts/startup-report/lib/mask.ts` — `maskConfig(obj, redactPaths)` 순수
- [NEW] `tooling/scripts/startup-report/lib/mask.test.ts`
- [MODIFY] `apps/api/src/main.ts` (또는 settings 로더) — 부트 시 `maskConfig` 결과 1회 로그

### C. config-graph
- [NEW] `tooling/scripts/config-graph/lib/to-mermaid.ts` — `toMermaid(schemaTree)` 순수
- [NEW] `tooling/scripts/config-graph/lib/to-mermaid.test.ts`
- [NEW] `tooling/scripts/config-graph/run.ts` — settings 스키마 → 트리 → mermaid stdout

### D. security-linter 결정
- [NEW] `docs/decisions/ADR-00NN-security-linter.md` (또는 walkthrough 결정 기록) — 3안 비교 + Go/No-Go
- (Go 시) 최소 설정 1개; (No-Go 시) 근거만

### 루트
- [MODIFY] `package.json` — `tooling:manifest`, `tooling:config-graph` 스크립트 + `yaml` devDep
- [MODIFY] `pnpm-workspace.yaml` — `yaml` catalog
- [NEW] `tooling/scripts/smoke-test.sh` — manifest 검증 + config-graph 출력 확인

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm exec vitest run tooling/scripts
```
`validateManifests` / `maskConfig` / `toMermaid` 검증 (정상 + 실패 케이스 + 시크릿 마스킹).

### 통합 테스트 (Integration Test Required = yes)
```bash
bash tooling/scripts/smoke-test.sh
```
`pnpm tooling:manifest` → 0 error, `pnpm tooling:config-graph` → mermaid 출력 검증, (가능 시) apps/api 부트 dump 에 시크릿 평문 없음 확인.

### 수동 검증
1. `apps/api` 부트 → masked config dump 에 `DATABASE_URL`/secret 이 `***` 류로 표시.
2. `pnpm tooling:manifest` 에 포트 충돌 service.yaml 주입 → 비-0 종료.

## 🔁 Rollback Plan

- 대부분 신규 파일(tooling/scripts/, service.yaml) + 스크립트/의존 추가. `apps/api/src/main.ts` 1곳만 수정(부트 로그 1줄) — 제거로 롤백.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음)
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
