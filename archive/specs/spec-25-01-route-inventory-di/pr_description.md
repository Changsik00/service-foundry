test(spec-25-01): harden route-inventory with guard order + DI-compile smoke

## 📋 Summary

### 배경 및 목적
phase-25(refactor-hardening-3) 첫 spec. phase-23 회고 §Wd 의 route-inventory 2 한계를 해소해 E3/E4(도메인 분리·패키지화) 이관의 **회귀 안전망**을 선결한다.

### 주요 변경 사항
- [x] **가드 선언순서 검증** — `routesOf` 의 guard `.sort()` 제거 → 선언 순서 그대로 스냅샷(순서 회귀 탐지)
- [x] **DI-compile smoke** — `AppModule.compile()` 로 전 컨트롤러/프로바이더 DI 그래프 resolve 검증. pg Pool lazy → 무-DB·9ms

### Phase 컨텍스트
- **Phase**: `phase-25`. 24-01(컨트롤러 안전망)과 같은 "안전망 선결" 패턴.

## 🎯 Key Review Points
1. 가드 순서: 현 선언이 알파벳순이라 스냅샷 불변 — 이후 `@UseGuards` reorder 시 실패(가드 실행순서 보장).
2. DI smoke: 모듈 compile 이 무-DB 로 동작(pool lazy 확인) → e2e 보다 빠른 DI 회귀 가드.

## 🧪 Verification
```bash
npx vitest --root apps/api run route-inventory module-di
turbo run lint typecheck test   # fresh 5434 DB → 151/151
```
**결과**: ✅ 151/151, 회귀 0.

## 📦 Files Changed
- `apps/api/src/auth/route-inventory.test.ts` (가드 선언순서)
- `apps/api/src/auth/module-di.smoke.test.ts` (신규 DI smoke)

## ✅ Definition of Done
- [x] guard 선언순서 검증 + EXPECTED 유지
- [x] AppModule DI-compile smoke PASS
- [x] 회귀 0, lint/typecheck/test PASS

## 🔗 관련
- phase-23 §Wd, phase-24 회고, `reference_route_inventory_pattern`
