# fix(spec-x-tenant-isolation-hardening): 테넌트 격리 하드닝 (쓰기 강제 + 슈퍼유저 가드)

## 📋 Summary

### 배경 및 목적
phase-17(ADR-0024)이 테넌트 읽기 격리를 실 경로에서 실효화했다. 본 spec-x 는 회고 이월 비차단 잔여(W-2/W-5/W-6)를 마무리해 격리를 견고히 한다.

### 주요 변경 사항
- [x] **W-2 쓰기 강제**: 도메인 3테이블(orgs/memberships/invitations) RLS 정책에 `WITH CHECK (org_id = 컨텍스트)` — ctx=A 의 org_id=B 쓰기 차단. 시스템 컨텍스트(NULL) 쓰기는 허용 → provision/invite accept 회귀 0
- [x] **W-5 슈퍼유저 가드**: 부팅 시 `SELECT rolsuper` → production 슈퍼유저 런타임 거부 (username 휴리스틱보다 정확)
- [x] **W-6 종결**: ResendNotifier happy+error 경로가 이미 테스트됨 확인 — 중복 추가 없이 한계(live-send 자동화 불가) 명시
- [x] 쓰기 격리 e2e + ADR-0024 보강

## 🎯 Key Review Points
1. **WITH CHECK 대칭** (`0014_rls_write_check.sql`): USING(읽기)과 동일 식으로 쓰기 강제. NULL/빈문자열 컨텍스트는 허용 — `runWithSystemTenant` 경로 호환.
2. **부팅 가드** (`superuser-guard.provider.ts`): OnApplicationBootstrap, prod 한정 fail-fast.
3. **회귀 0 증명**: 쓰기 격리 e2e(거부/허용 양 케이스) + 전체 146 tests GREEN (provision/invite accept/switch 포함).

## 🧪 Verification
```bash
DATABASE_URL=postgres://app_runtime:test@localhost:5434/test \
DATABASE_MIGRATE_URL=postgres://postgres:test@localhost:5434/test \
pnpm turbo run knip depcruise lint typecheck test build
```
**결과**: ✅ 전체 게이트 **137 tasks** · `@apps/api` **146 tests / 23 files** (fresh DB)

### 수동 검증
1. ctx=A INSERT org_id=B → 거부 / org_id=A → 허용
2. signup·invite create+accept·switch → 정상(회귀 0)
3. (단위) prod + rolsuper → 기동 거부

## 📦 Files Changed
### 🆕 New
- `apps/api/drizzle/0014_rls_write_check.sql`: 쓰기 강제 정책
- `apps/api/src/infra/superuser-guard.provider.ts` (+test): 부팅 슈퍼유저 거부

### 🛠 Modified
- `apps/api/src/infra/tenant-isolation.e2e.test.ts`: 쓰기 격리 케이스
- `apps/api/src/app.module.ts`: SuperuserGuard 등록
- `docs/adr/0024-tenant-isolation-enforcement.md`: 쓰기 강제·가드 보강

**Total**: 7 files, 6 commits

## ✅ Definition of Done
- [x] 단위 + 통합(쓰기 격리) 테스트 통과 + 기존 e2e 무회귀
- [x] W-2/W-5 해소, W-6 종결(기존 커버 확인)
- [x] lint / typecheck 통과
- [x] walkthrough / pr_description ship

## 🔗 관련 자료
- ADR: `docs/adr/0024-tenant-isolation-enforcement.md`
- 회고: `docs/review/2026-06-08-phase-17-review.md`
- 관련: spec-17-08 (격리 실 경로)
- **PR base**: `main` (spec-x)
