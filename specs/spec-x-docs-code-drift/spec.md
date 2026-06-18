# spec-x-docs-code-drift: 문서↔코드 정합성 drift 정정

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-docs-code-drift` |
| **Phase** | `phase-x` |
| **Branch** | `spec-x-docs-code-drift` |
| **상태** | Planning |
| **타입** | Docs |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
직전 `spec-x-docs-ssot` 로 문서 SSOT 정책·정본 architecture 를 정리했다. 그 직후 정본 문서가 **실제 코드/구조와 일치하는지** 코드레벨 감사를 수행했다 (read-only 서브에이전트 4분할 대조).

### 문제점
감사 결과 **코드는 문서대로 잘 이행돼 있으나(특히 auth/RLS/스택 불일치 0), 문서가 코드를 못 따라간 drift 가 다수** 발견됐다:

1. **패키지 카탈로그 undercount (4개 누락)** — `docs/index.md` 가 실제 존재하는 tracked 패키지 4개를 누락:
   - `@repo/backend-authz` (backend 22→23)
   - `@repo/nestjs-auth-firebase`, `@repo/nestjs-auth-supabase` (nestjs 6→8, firebase/supabase 모드 실어댑터)
   - `@repo/frontend-auth-store` (frontend 7→8)
   - 4개 모두 `docs/reference/packages/` 노트도 없음.
2. **`docs/turborepo-rules.md` 가 실제 설정과 어긋남 (5건)** — Node 22(실제 24)·`check-types`(실제 `typecheck`)·"루트 tsconfig.json 없음"(실제 존재)·`tsconfig.base.json`(없음)·biome `//#format-and-lint` 루트태스크(실제 `//#knip`/`//#depcruise`).
3. **stale 예시** — `config-typescript-config.md`·`turborepo-rules.md:370` 가 삭제된 `apps/admin` 을 현존처럼 서술 (ADR-0025).
4. **MOC 계약 위반** — `docs/review/*.md` 2건이 `index.md` 미등재 ("모든 노트 1줄 등재" 규약 위반).

> cruft 였던 `packages/backend/tmp-gencheck` (git 미추적 로컬 잔재) 는 본 spec 착수 전 로컬 `rm -rf` 로 이미 정리됨 — 레포 변경 아님.

### 해결 방안
정본 문서(`index.md`/`architecture.md`/`turborepo-rules.md`/`config-typescript-config.md`)를 **코드 현실에 맞춰 정정**하고, 누락된 reference note 4개를 신규 작성한다. 코드는 정답이므로 코드 변경 없음 (CONVENTIONS "라이브러리/코드가 SoT" 원칙).

## 요구사항

1. `docs/index.md` 패키지 카탈로그에 누락 4개 등재 + 카테고리 카운트 정정 (backend 22→23, nestjs 6→8, frontend 7→8).
2. `docs/reference/architecture.md` §6 / mermaid 에 authz·nestjs firebase/supabase 어댑터 반영.
3. `docs/reference/packages/` 에 누락 4개 reference note 신규 작성 (CONVENTIONS §9.1 스켈레톤 준수) + `index.md` 링크 + `log.md` 항목.
4. `docs/turborepo-rules.md` 5건 정정 — 단 루트 `tsconfig.json` 은 NestJS 데코레이터용 **의도적 일탈**로 명시(turbo 가이드와의 차이 + 이유).
5. stale `apps/admin` 예시 정정 (`config-typescript-config.md`, `turborepo-rules.md:370`).
6. `docs/review/*.md` 2건을 `index.md` 에 등재.

## Out of Scope

- 코드 변경 (auth/RLS/스택은 문서와 0 불일치 — 손대지 않음).
- `packages/frontend/auth-http` (README-only 의도된 stub, index 에 정확히 표기됨 — 유지).
- ADR 신규/개정 (이번 drift 는 결정 변경이 아니라 문서 동기화).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 코드가 SoT, 문서를 코드에 맞춤 (사용자 확인 완료 — option 1)
> - [x] tmp-gencheck 로컬 정리 (사용자 확인 완료)

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **누락 패키지** | 문서에 추가(카탈로그+reference note) | 코드 실존, 문서가 뒤처짐 |
| **turborepo-rules 예시** | 실제 설정값으로 정정 | 도구 설정의 SoT 는 실제 파일 |
| **루트 tsconfig.json** | "의도적 일탈" 노트로 명시 | NestJS 데코레이터 필요, 코드 동작 정답 |
| **stale apps/admin** | 제거/일반화 | ADR-0025 로 미존재 |

## Proposed Changes

#### [MODIFY] `docs/index.md`
누락 4개 reference 링크 등재 + 카테고리 카운트(backend/nestjs/frontend) 정정 + `review/` 2건 등재.

#### [MODIFY] `docs/reference/architecture.md`
§6 패키지 카테고리 요약 + §2/§3 mermaid 에 authz·nestjs firebase/supabase 반영.

#### [NEW] `docs/reference/packages/backend-authz.md`
#### [NEW] `docs/reference/packages/nestjs-auth-firebase.md`
#### [NEW] `docs/reference/packages/nestjs-auth-supabase.md`
#### [NEW] `docs/reference/packages/frontend-auth-store.md`
실제 src/export 기준 reference note (CONVENTIONS §9.1).

#### [MODIFY] `docs/turborepo-rules.md`
Node 24 / `typecheck` / 루트 tsconfig 현실+의도 일탈 / `tsconfig.base.json` 제거 / biome 루트태스크 현실(`//#knip`·`//#depcruise`) / apps/admin stale 정정.

#### [MODIFY] `docs/reference/packages/config-typescript-config.md`
stale `apps/admin` 예시 정리.

#### [MODIFY] `docs/log.md`
신규 노트/정정 항목 추가.

## 검증 계획

```bash
# 1. stale 토큰 0 확인 (실 claim 한정)
grep -rn "apps/admin" docs/reference docs/turborepo-rules.md | grep -v "신설 시\|제외\|ADR-0025"
# 2. 누락 패키지 reference note 4개 존재 확인
ls docs/reference/packages/backend-authz.md docs/reference/packages/nestjs-auth-firebase.md docs/reference/packages/nestjs-auth-supabase.md docs/reference/packages/frontend-auth-store.md
# 3. turborepo-rules 의 Node/태스크명 정정 확인
grep -n "node-version\|engines\|typecheck\|check-types" docs/turborepo-rules.md
# 4. 카탈로그 카운트 vs 실제 디렉토리 일치
ls packages/backend | grep -vc node_modules   # → 23
ls packages/nestjs | wc -l                      # → 8
ls packages/frontend | wc -l                    # → 8
```

수동 검증 시나리오:
1. `index.md` 카운트 = 실제 디렉토리 수 — 기대: backend 23 / nestjs 8 / frontend 8.
2. 신규 reference note 4개가 index 에서 링크되고 고립 노트 없음.

## ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] 없음 — 문서 동기화이며 신규 결정 아님 (루트 tsconfig 일탈은 기존 사실의 명시일 뿐).

## ✅ Definition of Done

- [ ] 검증 명령 모두 통과 (stale 0, note 4개 존재, 카운트 일치)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-x-docs-code-drift` 브랜치 push 완료
