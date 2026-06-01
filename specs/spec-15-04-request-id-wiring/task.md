# Task List: spec-15-04

> One Task = One Commit. 매 commit 직후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋
- [ ] `git checkout -b spec-15-04-request-id-wiring` (phase base 에서)
- [ ] Commit: `docs(spec-15-04): add spec/plan/task`

## Task 2: 미들웨어 응답 헤더 (TDD) ✅
- [x] `index.test.ts`: 응답 헤더 생성/에코 케이스 추가 + 기존 res mock(`{setHeader}`) 보강
- [x] `requestIdMiddleware`: `MinimalResponse { setHeader }` + `res.setHeader("x-request-id", requestId)`
- [x] 검증: `pnpm --filter @repo/backend-logger test` 12/12 + typecheck PASS
- [x] Commit: `feat(spec-15-04): expose x-request-id response header in requestIdMiddleware`

## Task 3: main.ts + e2e 배선
- [ ] `apps/api/src/main.ts`: `requestIdMiddleware()` 적용 (cookieParser 다음).
- [ ] `auth.e2e.test.ts`: 부트스트랩 미들웨어 추가 + "request-id" describe (생성 UUID / 제공 헤더 에코).
- [ ] 검증(로컬 Postgres 5434): `pnpm --filter @apps/api test` 전체 PASS + typecheck
- [ ] Commit: `feat(spec-15-04): apply requestIdMiddleware in apps/api bootstrap`

## Task 4: Ship
- [ ] 게이트: `pnpm turbo run lint typecheck test knip depcruise` (로컬 DB) PASS
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Ship commit: `docs(spec-15-04): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-15-security-wiring`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (ship 포함) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-01 |
