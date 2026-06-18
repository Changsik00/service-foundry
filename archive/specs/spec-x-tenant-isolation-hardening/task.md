# Task List: spec-x-tenant-isolation-hardening

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 + 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 사용자 Plan Accept

---

## Task 1: 쓰기 격리 테스트 (TDD Red)
- [x] `git checkout -b spec-x-tenant-isolation-hardening` (시작점 main)
- [x] `tenant-isolation.e2e.test.ts`: ctx=A 에서 org_id=B INSERT → 거부 기대 케이스 추가
- [x] 실행 → **Fail 확인**(현재 WITH CHECK(true) 로 통과)
- [x] Commit: `test(spec-x-tenant-isolation-hardening): add failing write-isolation case`

## Task 2: WITH CHECK 강제 (W-2)
- [x] `0014_rls_write_check.sql`(+journal): 3 도메인 정책에 org_id 일치 WITH CHECK
- [x] Red 케이스 GREEN 전환 + 기존 쓰기 흐름 회귀 점검
- [x] Commit: `feat(spec-x-tenant-isolation-hardening): enforce WITH CHECK org_id on domain tables`

## Task 3: 부팅 슈퍼유저 가드 (W-5)
- [x] `superuser-guard.provider.ts`(OnApplicationBootstrap): prod + rolsuper → throw. app.module 등록
- [x] 단위 테스트(superuser/비-superuser × prod/dev)
- [x] Commit: `feat(spec-x-tenant-isolation-hardening): refuse boot on superuser runtime (prod)`

## Task 4: W-6 에러경로 보강
- [-] 기존 `notification/index.test.ts` 가 happy+error 경로를 이미 커버 → 중복 추가 안 함 (Pass). 한계(live-send 자동화 불가)는 spec/walkthrough 명시

## Task 5: ADR-0024 보강
- [x] ADR-0024 Consequences/Status 에 "쓰기 강제 + 부팅 가드" 한 줄 반영
- [x] Commit: `docs(spec-x-tenant-isolation-hardening): note write-check + boot guard in ADR-0024`

---

## Task N: Ship
### 🚦 Pre-Push Quality Gate
- [x] lint/typecheck/knip/depcruise/test/build (fresh DB + app_runtime) GREEN
### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Ship Commit: `docs(spec-x-tenant-isolation-hardening): ship walkthrough and pr description`
### 🚀 Push & PR
- [x] Push + `gh pr create --base main`
- [x] 머지 후 `sdd specx done tenant-isolation-hardening`
- [x] 사용자 알림 + PR URL

---
## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 5 + Ship |
| 예상 commit 수 | ~7 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-06-08 |
