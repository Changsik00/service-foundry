# spec-26-02: users.public_id 도입

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-02` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-02-users-public-id` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Feature (schema/migration) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`users.id`(uuid PK, `gen_random_uuid()` DB default)가 API·JWT·admin 응답에 직접 노출된다(spec-26-01 감사). ADR-0028 은 불투명 `public_id`(UK)를 외부 식별자로 도입하기로 결정했다. `@repo/backend-id`(26-01)에 포맷·생성기가 준비됨.

### 문제점

- users 테이블에 외부 노출용 `public_id` 컬럼이 없다 — 후속 경계 정규화(26-03)가 노출할 식별자가 없음.
- **생성 권위 문제**: e2e/시드가 **raw SQL `INSERT`** 를 쓰므로(예: tenant-isolation 테스트의 `INSERT INTO invitations`), 앱-레이어 `$defaultFn` 만으론 직접 insert 시 public_id 가 누락된다 → DB-side default 필요.
- **백필**: 기존 행(다운스트림/개발 DB)에 public_id 를 채워야 NOT NULL UK 적용 가능.

### 해결 방안

DB-side plpgsql 함수 `gen_public_id(prefix)` 를 생성기 권위로 두고(PK 의 `gen_random_uuid()` 와 동형), `users.public_id text NOT NULL UNIQUE DEFAULT gen_public_id('usr')` 를 3-step 마이그레이션으로 추가한다. `@repo/backend-id` 의 TS `publicId()` 는 동일 포맷의 앱-레이어 생성기로 유지하되, **포맷 parity 를 테스트로 강제**(두 생성기가 같은 정규식 충족).

## 요구사항

1. **DB 생성 함수** `gen_public_id(prefix text) returns text`: prefix + `_` + Crockford base32 26자(128bit 랜덤). `@repo/backend-id.publicId()` 와 동일 포맷.
2. **`users.public_id`**: `text NOT NULL UNIQUE DEFAULT gen_public_id('usr')`.
3. **마이그레이션 3-step**(0021): ① 함수 생성 ② 컬럼 nullable 추가 + 기존 행 백필 ③ DEFAULT·NOT NULL·UNIQUE 적용. journal·snapshot 정합(`feedback_drizzle_migration_journal`).
4. **schema 반영**: `users.ts` 에 `publicId` 컬럼(`text().notNull().unique().default(sql\`gen_public_id('usr')\`)`).
5. **포맷 parity**: SQL 함수 출력과 TS `publicId(ID_PREFIX.user)` 출력이 동일 정규식(`^usr_[0-9A-HJKMNP-TV-Z]{26}$`) 충족.
6. **회귀 0**: 기존 e2e(native+provider) PASS, 격리 보존. public_id 는 아직 *응답에 노출하지 않음*(26-03 에서 사용).

## Out of Scope

- 내부 PK 의 v7 전환 (PG16 = native `uuidv7()` 없음 → plpgsql `gen_uuidv7()` 필요. 별도 처리 — 본 spec 은 public_id 만, PK 는 `gen_random_uuid()` 유지)
- JWT `sub` 전환·verifier/guard·응답 노출 (→ 26-03)
- organizations·sessions·api-keys (→ 26-04/05)
- 앱-레이어 `$defaultFn` 배선 (DB default 가 권위 — 불필요)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **생성 권위 = DB-side `gen_public_id` 함수** (앱-레이어 `$defaultFn` 아님). 근거: raw SQL insert 견고성 + PK(gen_random_uuid)와 동형. 트레이드오프: Crockford 로직이 plpgsql 에도 존재(앱과 2곳) → **parity 테스트로 드리프트 방지**.
> - [ ] **내부 PK v7 전환은 본 spec 에서 제외** (PG16 제약). ADR-0028 §3 는 유지하되 시행은 별도. 동의?

> [!WARNING]
> - [ ] 마이그레이션은 hand-written SQL(0021) — `drizzle-kit generate` 가 생성한 뼈대를 3-step 으로 수동 편집. snapshot/journal 정합 필수.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **생성기** | DB plpgsql `gen_public_id(prefix)` | raw insert·drizzle insert·백필 단일 권위, PK 동형 |
| **컬럼** | `text NOT NULL UNIQUE DEFAULT gen_public_id('usr')` | 외부 식별자, 충돌 방지 |
| **마이그레이션** | 3-step(함수→nullable+백필→제약) | 기존 행 보존하며 NOT NULL UK 안전 적용 |
| **parity** | TS `publicId` vs SQL 함수 동일 정규식 | 두 생성기 포맷 드리프트 차단 |

## Proposed Changes

#### [NEW] `apps/api/drizzle/0021_users_public_id.sql` (hand-written)
- `CREATE FUNCTION gen_public_id(prefix text)` — Crockford base32(랜덤 16바이트)
- `ALTER TABLE users ADD COLUMN public_id text;` → `UPDATE users SET public_id = gen_public_id('usr') WHERE public_id IS NULL;`
- `ALTER COLUMN public_id SET DEFAULT gen_public_id('usr'), SET NOT NULL;` + `CREATE UNIQUE INDEX users_public_id_unique`
- `apps/api/drizzle/meta/_journal.json` + `_snapshot` 정합

#### [MODIFY] `packages/backend/schema/src/users.ts`
- `publicId: text("public_id").notNull().unique().default(sql\`gen_public_id('usr')\`)`

#### [NEW] parity 테스트
- SQL 함수 출력 ↔ TS `publicId` 정규식 parity (DB 사용 → apps/api 통합 테스트; 공유 정규식 상수로 단언)

## 검증 계획

```bash
# fresh 5434 DB
DATABASE_URL=... DATABASE_MIGRATE_URL=... pnpm --filter @apps/api db:migrate
turbo run lint typecheck test
```

수동 검증 시나리오:
1. signup → `SELECT public_id FROM users WHERE id=...` → `^usr_[0-9A-HJKMNP-TV-Z]{26}$` 매칭 — 기대: PASS
2. raw `INSERT INTO users(email,...) VALUES(...)` (public_id 미지정) → DEFAULT 로 자동 채워짐 — 기대: PASS
3. 두 user 의 public_id 상이, UNIQUE 위반 없음 — 기대: PASS

## 롤백 계획

- `git revert` + down 마이그레이션 불요(컬럼 추가는 가역적). 운영 롤백 시 컬럼 유지해도 무해(미노출). state 영향 없음.

## ADR 후보

- [x] ADR-0028 에 이미 결정 — 본 spec 은 시행. (생성 권위=DB 함수 세부는 walkthrough 에 기록)
- [ ] 없음

## ✅ Definition of Done

- [ ] `gen_public_id` 함수 + `users.public_id` NOT NULL UK + 백필 마이그레이션(journal/snapshot 정합)
- [ ] schema `users.ts` 반영, 포맷 parity 검증
- [ ] 전체 게이트(fresh DB) 회귀 0 (native+provider)
- [ ] `walkthrough.md`/`pr_description.md` + 브랜치 push
