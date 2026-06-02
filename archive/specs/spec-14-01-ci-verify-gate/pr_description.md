# feat(spec-14-01): CI PR 검증 게이트 (.github/workflows/verify.yml)

## 📋 Summary
### 배경
PR 검증 자동화 부재로 #80(typecheck 누수 → storage stub 머지) + #83(lockfile importer 누락)이 실제 발생. 로컬 훅·turbo 캐시로는 결정론적 차단 불가.
### 주요 변경
- [x] `.github/workflows/verify.yml` — `pull_request`(전체) + `push`(main). clean 환경에서 `pnpm install --frozen-lockfile` → `db:migrate` → `pnpm turbo run lint typecheck test build`.
- [x] **postgres service container**(16-alpine, 5434/test) + 마이그레이션 — apps/api e2e('real PG') 포함 전체 test 실행. (redis 불요 확인)
- [x] **fix**: `password-reset/email-verify .confirm.service.test.ts` NOTIFIER mock 누락 보정(phase-12 포트 도입 후 잠재 8 fail). 게이트는 그린이어야 의미.

### Phase 컨텍스트
- phase-14 성공 기준 5(CI PR 게이트) 충족. knip/depcruise(루트 미배선)는 후속.

## 🎯 Key Review Points
1. **게이트가 즉시 31 fail 잠재 결함을 노출** → 단위 8 수정 + e2e 인프라 제공으로 해소. 로컬 CI 동등 명령 **129/129**.
2. service container 구성(5434/test)이 e2e 기본 DATABASE_URL 과 일치. concurrency cancel-in-progress.
3. 통합 검증 = **본 PR 의 `verify` 체크 green**(워크플로 자기 검증).

## 🧪 Verification
```bash
# 로컬 (CI 동등): postgres 5434 + migrate 후
pnpm install --frozen-lockfile
pnpm --filter @apps/api db:migrate          # 8 migrations
pnpm turbo run lint typecheck test build     # 129/129 successful
```
+ 본 PR 의 GitHub Actions `verify` 잡 green.

## 📦 Files Changed
- `.github/workflows/verify.yml` (신규)
- `apps/api/src/auth/{password-reset,email-verify}.confirm.service.test.ts` (NOTIFIER mock)
- `specs/spec-14-01-ci-verify-gate/**`, `backlog/phase-14.md`

## ✅ Definition of Done
- [x] verify.yml + 로컬 동등 129/129
- [x] NOTIFIER 단위버그 수정 (apps/api 85/85)
- [ ] **본 PR verify 체크 green** (머지 전 관측)
- [x] walkthrough / pr_description ship

## 🔗 관련
- 후속: knip/depcruise 배선, spec-14-06(changesets+docker)
