# Task List: spec-26-02

> One Task = One Commit. 안전: DB-side default + 3-step 마이그레이션, public_id 미노출(회귀면 격리·auth e2e).

---

## Task 1: users.public_id (DB 함수 + 마이그레이션 + schema) (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-02-users-public-id` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 작성 (TDD Red)
- [x] `apps/api` 통합 테스트: signup 후 `SELECT public_id` → `^usr_[0-9A-HJKMNP-TV-Z]{26}$`, raw INSERT 시 DEFAULT 채움, 2건 상이/UNIQUE. **raw SQL 조회**로 타입 비결합(컬럼 미존재 시 런타임 RED)
- [x] 실행 → Fail (컬럼/함수 부재)
- [x] Commit: `test(spec-26-02): add failing test for users.public_id (format/default/unique)`

### 1-3. 구현 (TDD Green)
- [x] `apps/api/drizzle/0021_users_public_id.sql` — `gen_public_id` 함수 + 3-step(컬럼 nullable→백필→DEFAULT/NOT NULL/UNIQUE)
- [x] `meta/_journal.json` (idx 21) + `_snapshot` 정합 — 가능하면 `db:generate` 뼈대 후 수동 편집, 아니면 수동 추가
- [x] `packages/backend/schema/src/users.ts` — `publicId` 컬럼(`.notNull().unique().default(sql\`gen_public_id('usr')\`)`)
- [x] fresh DB migrate → 통합 테스트 PASS, `turbo typecheck` PASS
- [x] Commit: `feat(spec-26-02): add users.public_id with DB gen_public_id default + backfill`

---

## Task 2: 포맷 parity 가드

### 2-1. parity 테스트
- [x] SQL `gen_public_id('usr')` 출력 ↔ TS `publicId(ID_PREFIX.user)` 동일 정규식 단언 (공유 상수)
- [x] Commit: `test(spec-26-02): assert SQL/TS public_id format parity`

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0 (native+provider)

### 📝 산출물 작성
- [x] **walkthrough.md** (생성 권위=DB 함수 결정·PK v7 분리 근거)
- [x] **pr_description.md**
- [x] Commit: `docs(spec-26-02): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-02-users-public-id`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
