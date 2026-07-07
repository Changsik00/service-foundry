# Task List: spec-25-01

> One Task = One Commit. E3/E4 안전망 선결.

---

## Task 1: 브랜치 생성
- [x] `git checkout -b spec-25-01-route-inventory-di` (base: `phase-25-refactor-hardening-3`)

## Task 2: 가드 선언순서 검증 (route-inventory)
- [x] `routesOf` guard `.sort()` 제거 → 선언 순서. EXPECTED_AUTH_ROUTES / EXPECTED_OTHER_ROUTES 순서 갱신
- [x] 실행 → route-inventory PASS (순서 반영)
- [x] Commit: `test(spec-25-01): verify guard declaration order in route-inventory (Wd)`

## Task 3: DI-compile smoke
- [x] AppModule(+ProviderAuthModule) `.compile()` DI resolve 테스트 추가 (무-DB 가능 확인, 필요 시 DB 게이트)
- [x] 실행 → PASS
- [x] Commit: `test(spec-25-01): add module DI-compile smoke as refactor safety net (Wd)`

## Task 4: Ship
### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0
### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-25-01): ship walkthrough and pr description`
### 🚀 Push & PR
- [x] `git push -u origin spec-25-01-route-inventory-di`
- [x] PR 생성 (base: `phase-25-refactor-hardening-3`)
