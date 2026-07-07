# Task List: spec-26-06

> One Task = One Commit. 내부 FK/rotation/verifyKey 불변 — api-key/session 격리·동작 e2e 회귀 0.

---

## Task 1: api_keys.public_id + 응답/revoke 전환 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-06-remaining-roots-public-id` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 (Red)
- [x] e2e: POST/GET /auth/api-keys → `id`=`^key_…`, `orgId`=`^org_…`; DELETE(public_id) 204, 타 org 키 403
- [x] Commit: `test(spec-26-06): api_keys public_id exposure + delete by public_id`

### 1-3. 구현 (Green)
- [x] `api-keys.ts` publicId 컬럼 + 마이그레이션(VOLATILE 백필)
- [x] `api-key.service.ts`: list/create `id`=public_id·`orgId`=org public(조인), `revoke(publicId, orgId)` → WHERE public_id+org_id. verifyKey 내부 유지
- [x] 단위/e2e PASS, typecheck
- [x] Commit: `feat(spec-26-06): expose api_keys public_id + delete by public_id`

---

## Task 2: sessions.public_id + 응답/revoke 전환 (TDD)

### 2-1. 테스트 (Red)
- [x] e2e: GET /auth/sessions → `id`=`^ses_…`; DELETE(내 세션 public_id) 204, 타인 세션 403
- [x] Commit: `test(spec-26-06): sessions public_id exposure + delete by public_id`

### 2-2. 구현 (Green)
- [x] `auth-session/schema.ts` publicId 컬럼 + 마이그레이션(VOLATILE 백필)
- [x] `session.stores.ts`: publicId 노출 + `findByPublicId`. `session-management.service.ts`: listSessions `id`=public·`orgId`=org public, `revokeSession(userId, sessionPublicId)` → findByPublicId + 소유 검증
- [x] 단위/e2e PASS, typecheck
- [x] Commit: `feat(spec-26-06): expose sessions public_id + delete by public_id`

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0

### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-26-06): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-06-remaining-roots-public-id`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
