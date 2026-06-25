# Walkthrough: spec-26-02

> `users.public_id`(불투명 외부 식별자) 도입 — DB-side 생성 권위 + 백필.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 생성 권위 | 앱 `$defaultFn` / **DB 함수** | **DB-side `gen_public_id(prefix)`** | e2e/시드가 raw SQL INSERT 사용 → 앱 default 누락. PK `gen_random_uuid()` 동형. 백필도 동일 함수 |
| 랜덤원 | pgcrypto `gen_random_bytes` / **gen_random_uuid** | **`gen_random_uuid()` 디코드** | core(PG13+), pgcrypto 확장 비의존(다운스트림 이식성). 122bit 엔트로피 충분 |
| 백필 | 별도 UPDATE 단계 / **VOLATILE default** | **ADD COLUMN DEFAULT(volatile) NOT NULL** | PG 가 기존 행을 행별 평가 → 백필 자동, 1문장 |
| PK v7 | 본 spec 포함 / **분리** | **분리** | PG16 = native `uuidv7()` 없음 → plpgsql 필요. 별도 처리(ADR-0028 §3 의도 유지) |

## 💬 사용자 협의

- 생성 권위(DB 함수)·PK v7 분리 2결정 제시 → "accept".

## 🧪 검증 결과

- 통합 4/4(fresh DB): signup→public_id 형식 / raw INSERT DEFAULT 채움 / **SQL·TS 포맷 parity**(출력 구조 동일) / UNIQUE.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, apps/api **345/345**(기존 341+신규 4), 회귀 0.
- app_runtime(비-superuser) 도 signup INSERT 시 DEFAULT 평가 성공 → 함수 PUBLIC EXECUTE 확인.

## 🔧 변경

- [NEW] `apps/api/drizzle/0021_mute_sunset_bain.sql` — `gen_public_id` plpgsql + `users.public_id` ADD COLUMN(volatile default→자동 백필) + UNIQUE. journal idx 21 + snapshot 정합(`db:generate` 뼈대 후 함수 prepend).
- [MODIFY] `packages/backend/schema/src/users.ts` — `publicId` 컬럼(`sql\`gen_public_id('usr')\`` default).
- [MODIFY] `apps/api` — `@repo/backend-id` 의존 추가 + parity 테스트.

## 🚧 이월

- public_id 는 아직 **미노출** — JWT `sub` 전환·응답 노출·식별자 정규화는 26-03.
- 내부 PK v7 전환은 별도(plpgsql `gen_uuidv7`).
