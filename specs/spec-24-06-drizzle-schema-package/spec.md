# spec-24-06: Drizzle 스키마 패키지 이관 (E2)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-06` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-06-drizzle-schema-package` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Refactor (아키텍처) |
| **작성일** | 2026-06-23 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (§11.3 재검증 결과)

Drizzle 스키마가 `apps/api/src/infra/schema/` 에 앱-로컬 — **15 파일 / 358 LOC**(감사의 "50+ 파일"은 과대평가, 실측 정정). 소비처 18 파일(stores·app.module appSchema·drizzle.config). 스키마 파일은 상호 `./X.js` + `drizzle-orm/pg-core` + 외부 3 패키지(audit/rate-limit/session) 의존.

마이그레이션 SQL(0000~0009) + `_journal.json` 은 `apps/api/drizzle/` 에 **스키마 소스와 분리** 보관. drizzle.config 의 `schema: ./src/infra/schema/local.ts` 만 마이그레이션 생성 소스.

### 문제점

- 스키마 정의가 앱에 묶여 worker 등 타 앱·패키지가 재사용 불가. (auth-* 패키지는 이미 자체 schema 보유 — 일관성 결여.)

### 해결 방안

스키마 소스 15 파일을 **`@repo/backend-schema`** 로 이관(`git mv` 로 히스토리 보존). **마이그레이션+drizzle.config 는 apps/api 잔류**(결정 로그: app=마이그레이션 러너, package=재사용 스키마 정의). 소비처 18 파일은 단일 `@repo/backend-schema` barrel 로 import 수렴(barrel 이 모든 테이블/타입 re-export). drizzle.config `schema` 경로만 패키지로 갱신.

**저널 정합(핵심)**: `db:generate` 가 **신규 마이그레이션 0** (스키마 내용 무변경) + fresh DB `db:migrate` 클린 적용 + e2e 회귀 0 으로 증명.

## 요구사항

1. `@repo/backend-schema` 신규 — 15 스키마 파일 `git mv` 이관, barrel(index) + local(마이그레이션 소스) 유지.
2. 소비처 18 파일 import → `@repo/backend-schema` (직접 테이블 import 포함 barrel 로 수렴).
3. drizzle.config `schema` 경로 → 패키지. 마이그레이션/`_journal.json` 은 apps/api 잔류.
4. **저널 정합**: `db:generate` no-op(신규 마이그레이션 0) + fresh DB `db:migrate` 클린 + e2e 회귀 0.
5. lint/typecheck/전체 테스트 PASS.

## Out of Scope

- E3(provision·org 도메인 서비스 분리) — 별도. 스키마(테이블 정의) 이관은 도메인 서비스 분리와 독립.
- 마이그레이션 파일/`_journal.json` 이동 (저널 drift 위험, app 잔류).
- 스키마 내용(컬럼/인덱스) 변경.

## 🛑 사용자 검토 필요

> [!WARNING]
> - [ ] 마이그레이션 저널 drift 시 CI 500/컬럼 누락. → `db:generate` no-op 확인 + fresh DB migrate 증명 (auto 정지규칙: migrate 실패 시 정지).

## 핵심 전략

| 컴포넌트 | 결정 | 이유 |
|:---:|:---|:---|
| 스키마 소스 | `@repo/backend-schema` (git mv) | 재사용 + 히스토리 보존 |
| 마이그레이션/config | apps/api 잔류 | 저널 정합·deploy 관심사 (결정 로그) |
| 소비처 import | 단일 barrel 수렴 | 직접 테이블 import 도 barrel 이 re-export |

## Proposed Changes

#### [NEW] `packages/backend/schema/` — package.json(deps: drizzle-orm, @repo/backend-auth-{audit,session}, @repo/backend-auth-rate-limit), tsconfig, src/(15 파일 git mv)
#### [MODIFY] `apps/api/drizzle.config.ts` — `schema` 경로를 패키지 local 로
#### [MODIFY] 소비처 18 파일 — `../infra/schema/*` → `@repo/backend-schema`
#### [MODIFY] `apps/api/package.json` — `@repo/backend-schema` dep
#### [DELETE] `apps/api/src/infra/schema/` (이관 후 빈 디렉토리)

## 검증 계획

```bash
pnpm install
pnpm --filter @apps/api db:generate   # 기대: 신규 마이그레이션 0 (no drift)
# fresh DB 저널 정합 증명 + e2e (reference_local_e2e_db_recipe)
DATABASE_MIGRATE_URL=... pnpm --filter @apps/api db:migrate
DATABASE_URL=... npx vitest --root apps/api run e2e.test
npx turbo run lint typecheck test
```

## 롤백 계획

- `git revert`. 스키마 이동+import 교체라 원복 가능. 마이그레이션/저널 무변경이라 DB 영향 없음.

## ADR 후보

- [x] 없음 (ADR-0015 경계 적용. 경계 결정은 phase decision log 에 기록됨)

## ✅ Definition of Done

- [ ] `@repo/backend-schema` 생성(git mv 15 파일), 소비처 import 수렴, drizzle.config 갱신
- [ ] `db:generate` no-op + fresh DB `db:migrate` 클린 + e2e 회귀 0
- [ ] `infra/schema/` 삭제, lint/typecheck/test PASS
- [ ] walkthrough/pr_description ship + 브랜치 push
