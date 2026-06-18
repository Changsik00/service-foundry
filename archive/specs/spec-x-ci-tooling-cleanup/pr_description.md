# chore(spec-x-ci-tooling-cleanup): clean knip hints + run tooling tests in CI

## 📋 Summary

### 배경 및 목적
CI/tooling 위생 소품 2건 묶음:
- **knip 40 힌트**: `packages/backend/*` 와일드카드 entry 의 `roundtrip.ts`·`emit-span.ts` 가 일부 패키지에만 존재 → 22개 패키지에서 "no matches" 힌트.
- **tooling 테스트 CI 미수집**: tooling 이 워크스페이스 패키지가 아니라 `turbo run test` 가 안 잡음.

### 주요 변경 사항
- [x] knip: 와일드카드에서 roundtrip/emit-span 제거 + cache·queue·observability per-package entry, apps/worker 빈 설정 → **힌트 40→0**
- [x] `verify.yml`: `npx vitest run tooling` 스텝 추가 → tooling 테스트 3종 CI 실행

## 🎯 Key Review Points
1. **knip entry 재배치**: roundtrip.ts(cache/queue), emit-span.ts(observability)만 보유 → per-package 로 좁힘. unused 회귀 없음 확인.
2. **apps/worker**: 테스트 없는 앱 → `{}`(knip 자동 감지, main.ts).
3. **tooling 테스트**: DB 불필요 → install 직후 배치.

## 🧪 Verification
```bash
pnpm turbo run knip       # Configuration hints 0
npx vitest run tooling    # 3 files / 14 tests pass
```
- 핵심 검증: 본 PR verify CI (knip 게이트 + 신규 tooling 스텝).

## 📦 Files Changed
- `packages/config/knip-config/base.json`: entry 패턴 정리
- `.github/workflows/verify.yml`: tooling 테스트 스텝

## ✅ Definition of Done
- [x] knip 힌트 0 (회귀 없음)
- [x] verify.yml tooling 스텝 + 로컬 통과
- [ ] PR verify CI 그린
