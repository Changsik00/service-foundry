# Task List: spec-25-02

> One Task = One Commit. 내부 구현 수렴(공개 계약 불변). 안전망: 25-01 DI smoke + 기존 verifier/guard 단위.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-25-02-factory-guard-dedup` (base: `phase-25-refactor-hardening-3`)

## Task 2: D6 — roles guard 제네릭 팩토리
- [ ] `createRolesGuard(metaKey, pickRole)` 도입 → `RolesGuard`/`OrgRolesGuard` 내부 수렴 (export/동작 보존)
- [ ] 실행 → nestjs-auth 단위(roles/org-roles guard) PASS, typecheck
- [ ] Commit: `refactor(spec-25-02): unify RolesGuard/OrgRolesGuard via generic factory (D6)`

## Task 3: D2 — verifier 공통 헬퍼 → [-] 드롭 (per-item 검증 결과)
- [-] **드롭**: supabase/firebase verifier 의 공통 표면이 ~5줄뿐이고 seam(디코딩·sub 교체·라이트백·port 타입)이 provider별로 달라, 공유 헬퍼는 어댑터 독립성(ADR-0015) 훼손 + 타입 손실. 이득<비용 → 비채택 (사용자 승인 2026-06-24). queue Icebox 미이월(재추진 가치 낮음).

## Task 4: Ship
### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test` (fresh 5434 DB) + DI smoke → 회귀 0
### 📝 산출물
- [ ] walkthrough.md (D4 드롭 사유 포함) / pr_description.md
- [ ] Commit: `docs(spec-25-02): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-25-02-factory-guard-dedup`
- [ ] PR 생성 (base: `phase-25-refactor-hardening-3`)
