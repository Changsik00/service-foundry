# Task List: spec-26-03

> One Task = One Commit. 안전: 응답 직렬화 전환(내부 동작 불변). 회귀망 = 기존 auth/org/격리 e2e.

---

## Task 1: API 응답 식별자 전환 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-03-auth-boundary-normalize` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 작성 (TDD Red)
- [x] e2e: signin/signup/refresh 응답 `user.id` → `^usr_[…]{26}$`(uuid 아님). `GET /auth/me` 식별자 = public_id, 응답 JSON 에 내부 uuid 부재
- [x] 실행 → Fail (현재 uuid 반환)
- [x] Commit: `test(spec-26-03): assert auth responses expose public_id not internal uuid`

### 1-3. 구현 (TDD Green)
- [x] `auth-controller.shared.ts` — `S_User.id` format string
- [x] `auth.controller.ts` — signin/signup/refresh `id: user.publicId`; `/auth/me` → `{ id: row.publicId, email, role, orgId, displayName }`
- [x] `provider-me.controller.ts` — 식별자 row.publicId
- [x] `oauth.controller.ts` — callback `userId` 값 publicId
- [x] fresh DB → e2e PASS, typecheck
- [x] Commit: `feat(spec-26-03): expose users.public_id in auth responses (id/me/oauth)`

---

## Task 2: web /auth/me 소비처 반영

### 2-1. web 수정 (TDD)
- [x] `AccountCard`·`ProfileForm` 의 `user.sub` → `user.id`(public_id). 관련 단위 테스트/스키마(zod) 갱신
- [x] web 단위 테스트 PASS
- [x] Commit: `feat(spec-26-03): web /auth/me uses public_id identifier`

---

## Task 3: ADR §1 완화

### 3-1. 문서
- [x] `docs/adr/0028-public-id-scheme.md` §1 — JWT sub 예외(self-bearer) 명문화, 불변식=응답 body·URL
- [x] Commit: `docs(spec-26-03): relax ADR-0028 §1 (JWT sub self-bearer exception)`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0 (native+provider+web)

### 📝 산출물 작성
- [x] **walkthrough.md** / **pr_description.md**
- [x] Commit: `docs(spec-26-03): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-03-auth-boundary-normalize`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
