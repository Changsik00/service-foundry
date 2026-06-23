refactor(spec-24-06): extract drizzle schema into @repo/backend-schema

## 📋 Summary

### 배경 및 목적
phase-23 감사 §E2. Drizzle 스키마가 `apps/api/src/infra/schema/` 에 앱-로컬(15 파일/358 LOC). 재사용 가능한 패키지 경계로 이관(auth-* 패키지는 이미 자체 schema 보유 — 일관성).

### 주요 변경 사항
- [x] **`@repo/backend-schema`** 신규 — 15 스키마 파일 `git mv`(히스토리 보존). barrel(index) + `/local`(마이그레이션 소스).
- [x] 소비처 18 파일 import → `@repo/backend-schema` 단일 barrel 수렴.
- [x] `drizzle.config.ts` `schema` 경로만 패키지로. **마이그레이션 + `_journal.json` 은 apps/api 잔류**(저널 정합·deploy 관심사).

### Phase 컨텍스트
- **Phase**: `phase-24` (E2, 마지막 spec). E3/E4 는 후속 phase 후보.

## 🎯 Key Review Points

1. **저널 정합(핵심)**: `db:generate` → 드리프트 0("No schema changes") + **fresh DB `db:migrate` 클린 적용**. 마이그레이션 무변경.
2. **git mv**: 전 파일 rename 100% — 내용 무변경, 위치만 이동.
3. **mock 견고화**: barrel 의 `sessions` 재export 와 부분 mock 충돌 → 실제 export 보존 부분 mock 으로 수정(`org-invite.service.test.ts`).

## 🧪 Verification

```bash
pnpm --filter @apps/api db:generate    # 드리프트 0
# fresh DB
pnpm --filter @apps/api db:migrate     # 클린 적용
turbo run lint typecheck test          # 로컬 5434 DB
```
**결과**: ✅ 151/151 task. apps/api 237 단위 + e2e, 회귀 0. 저널 정합 증명.

## 📦 Files Changed

### 🆕 New
- `packages/backend/schema/**` (package.json/tsconfig/vitest + 15 schema 파일 이관)

### 🛠 Modified
- `apps/api/drizzle.config.ts` (schema 경로)
- `apps/api/package.json` (`@repo/backend-schema` dep)
- 소비처 18 파일 (import → `@repo/backend-schema`)
- `apps/api/src/auth/org-invite.service.test.ts` (부분 mock 견고화)

### 🗑 Deleted
- `apps/api/src/infra/schema/` (전 파일 패키지로 이동)

## ✅ Definition of Done

- [x] `@repo/backend-schema` 생성(git mv), 소비처 수렴, drizzle.config 갱신
- [x] db:generate 드리프트 0 + fresh DB migrate 클린 + e2e 회귀 0
- [x] infra/schema 삭제, lint/typecheck/test PASS
- [x] walkthrough / pr_description ship commit

## 🔗 관련 자료
- ADR-0015 (패키지 경계), `feedback_drizzle_migration_journal`
- Phase: `backlog/phase-24.md`
