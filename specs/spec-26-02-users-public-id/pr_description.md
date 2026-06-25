feat(spec-26-02): add users.public_id with DB gen_public_id default + backfill

## 📋 Summary

### 배경 및 목적
ADR-0028 의 불투명 외부 식별자 `public_id` 를 `users` 에 도입한다(spec-26-01 감사로 확정된 첫 root). 후속 경계 정규화(26-03)가 노출할 외부 식별자를 마련한다. 본 PR 은 **컬럼/생성기/백필**만 — 아직 응답에 노출하지 않는다.

### 주요 변경 사항
- [x] **DB-side `gen_public_id(prefix)`** plpgsql 함수 — prefix + Crockford base32 26자(`@repo/backend-id.publicId()` 동일 포맷). 랜덤원 `gen_random_uuid()`(core, pgcrypto 비의존)
- [x] **`users.public_id`** `text NOT NULL UNIQUE DEFAULT gen_public_id('usr')` — VOLATILE default 로 기존 행 자동 백필
- [x] schema `users.ts` 반영 + journal/snapshot 정합(idx 21)
- [x] **포맷 parity 테스트** — SQL·TS 생성기 출력 구조 동일 검증(드리프트 차단)

### 타입
- **Feature (schema/migration)** · spec-26-02 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **생성 권위 = DB 함수**: e2e/시드가 raw SQL INSERT 를 쓰므로 앱 `$defaultFn` 으론 누락 → DB default 가 견고(PK `gen_random_uuid()` 동형). 트레이드오프(Crockford 2곳)는 parity 테스트로 가드.
2. **백필 = VOLATILE default**: `ADD COLUMN DEFAULT(volatile) NOT NULL` 이 PG 에서 기존 행 행별 평가 → 별도 UPDATE 불요.
3. **PK v7 분리**: PG16 native `uuidv7()` 부재로 본 spec 제외(PK 는 `gen_random_uuid()` 유지). ADR-0028 §3 의도 유지.
4. public_id 미노출 — 회귀 안전망은 기존 auth/격리 e2e.

## 🧪 Verification
```bash
DATABASE_URL=... DATABASE_MIGRATE_URL=... pnpm --filter @apps/api db:migrate
turbo run lint typecheck test   # fresh 5434 DB
```
- 통합 4/4: 형식·DEFAULT 백필·parity·UNIQUE.
- 전체: **154/154 tasks**, apps/api **345/345**, 회귀 0.

## 📦 Files Changed
- `apps/api/drizzle/0021_mute_sunset_bain.sql` + `meta/{_journal,0021_snapshot}.json`
- `packages/backend/schema/src/users.ts`
- `apps/api/{package.json, src/auth/users-public-id.e2e.test.ts}`

## ✅ Definition of Done
- [x] `gen_public_id` + `users.public_id` NOT NULL UK + 자동 백필 (journal/snapshot 정합)
- [x] schema 반영 + 포맷 parity
- [x] 전체 게이트 회귀 0
- [x] walkthrough/pr_description + 브랜치 push

## 🔗 관련
- ADR-0028, spec-26-01(@repo/backend-id), 후속 26-03(경계 정규화·노출)
