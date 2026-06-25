# Task List: spec-26-05

> One Task = One Commit. RLS/JWT 내부 uuid 불변 — 격리 e2e 회귀 0 필수(`feedback_isolation_test_real_path`).

---

## Task 1: organizations.public_id 컬럼 + 백필 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-05-org-public-id-rls` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 (Red)
- [x] e2e/통합: signup 후 org 의 public_id 가 `^org_[…]{26}$`(raw SQL). UNIQUE/DEFAULT 백필
- [x] Commit: `test(spec-26-05): add failing test for organizations.public_id`

### 1-3. 구현 (Green)
- [x] `organizations.ts` publicId 컬럼 + 마이그레이션(VOLATILE default 백필, journal/snapshot)
- [x] fresh DB migrate → PASS, typecheck
- [x] Commit: `feat(spec-26-05): add organizations.public_id (gen_public_id('org') default)`

---

## Task 2: org 응답 식별자 + member userId 노출 전환 (TDD)

### 2-1. 테스트 (Red)
- [x] e2e: `/auth/orgs`·`/auth/me`·`/auth/org/members` org 식별자 = `org_…`(uuid 아님), members userId = `usr_…`
- [x] Commit: `test(spec-26-05): assert org responses expose org/user public_id`

### 2-2. 구현 (Green)
- [x] org-list/org-members/auth.me/provider-me/provider-org/admin → org public_id (+ members userId = user public_id)
- [x] 단위/e2e PASS, typecheck
- [x] Commit: `feat(spec-26-05): expose org public_id (+ inherited user public_id) in responses`

---

## Task 3: switch 입력 public_id 해석 + 멤버십 검증 (TDD)

### 3-1. 테스트 (Red)
- [x] e2e: switch(내 org public_id)→200; switch(비멤버 public_id)→403; switch(미존재)→403
- [x] Commit: `test(spec-26-05): org switch accepts public_id with membership gate`

### 3-2. 구현 (Green)
- [x] `OrgSwitchInput` public_id 형식, org-switch/provider-org-switch: public→내부 해석 + 멤버십 검증(ADR-0029)
- [x] PASS, typecheck
- [x] Commit: `feat(spec-26-05): resolve org public_id on switch input (membership-gated)`

---

## Task 4: web 반영 — **no-op (코드 변경 불요)**

### 4-1. web
- [x] web 은 org/user 식별자를 `z.string()`(uuid 비강제)로만 다루고 받은 값을 그대로 switch 입력으로 echo → public_id 전환에 **투명 호환**. 코드 변경·신규 커밋 없음. web typecheck+test green 확인. (refute #1: DoD "web 반영"은 format-agnostic 코드로 충족 — 향후 uuid 가정 변경 시 조용히 깨질 잠재 부채로 기록)

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0 (tenant-isolation 포함)
- [x] (선택) `/hk-refute` — RLS/격리 영향이라 권장

### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-26-05): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-05-org-public-id-rls`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
