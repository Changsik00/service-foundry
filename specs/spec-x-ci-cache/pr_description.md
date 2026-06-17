# chore(spec-x-ci-cache): add turbo + playwright caching to CI

## 📋 Summary

### 배경 및 목적
CI 가 변경과 무관한 작업까지 매번 재실행해 느림. pnpm store 는 이미 캐시되나 **turbo 태스크 출력**과 **Playwright 브라우저**는 캐시되지 않았다. `actions/cache` 로 둘을 추가해 변경 없는 작업을 스킵한다.

### 주요 변경 사항
- [x] `verify.yml`: `.turbo` 캐시 (key `turbo-${os}-${sha}` + restore-keys) → `turbo run` 태스크 캐시 적중
- [x] `e2e.yml`: `~/.cache/ms-playwright` 캐시 (key=lockfile 해시) → 브라우저 재다운로드 스킵

## 🎯 Key Review Points

1. **정확성 무영향**: turbo 캐시는 소스/lockfile 변경 시 해시로 자동 무효화 → 속도 최적화일 뿐.
2. **e2e 는 playwright 만**: `e2e.yml` 은 `turbo run` 미사용(`--filter` 직접)이라 turbo 캐시 불필요.
3. **키 전략**: turbo=sha별 저장+직전 복원, playwright=lockfile 종속.

## 🧪 Verification

- YAML 파싱 통과 (verify.yml·e2e.yml).
- **실검증은 본 PR CI**: 1회차 그린(캐시 채움) → 재실행 2회차에서 turbo `FULL TURBO` + playwright 캐시 복원으로 시간 단축 확인.

## 📦 Files Changed
- `.github/workflows/verify.yml` (+9): turbo 캐시 스텝
- `.github/workflows/e2e.yml` (+9): playwright 캐시 스텝

## ⚠️ Out of Scope (→ 후속)
- Turborepo Remote Cache (원격 공유)
- `release.yml` docker 레이어 gha 캐시

## ✅ Definition of Done
- [x] verify turbo 캐시 + e2e playwright 캐시 추가
- [x] YAML 유효
- [ ] PR CI 그린 (1회차) + 2회차 캐시 적중 확인
