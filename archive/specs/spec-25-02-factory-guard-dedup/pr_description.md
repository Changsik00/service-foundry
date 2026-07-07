refactor(spec-25-02): unify RolesGuard/OrgRolesGuard via shared checkRoles (D6)

## 📋 Summary

### 배경 및 목적
phase-25 감사 §D 중복 제거. 착수 전/중 per-item 검증으로 scope 확정: **D6 채택, D2·D4 드롭**.

### 주요 변경 사항
- [x] **D6**: `RolesGuard`·`OrgRolesGuard` 의 동일한 canActivate 로직을 공유 함수 `checkRoles` 로 수렴. 클래스명·export·동작 보존.
- [x] **D2 드롭**: firebase/supabase verifier 의 공통 표면이 ~5줄뿐, seam(디코딩·sub 교체·라이트백·port 타입) provider별 상이 → 공유 시 어댑터 결합(ADR-0015 위반)·타입 손실. 비채택.
- [x] **D4 드롭**: forRoot 8모듈 bespoke → 과도추상화. 비채택.

### Phase 컨텍스트
- **Phase**: `phase-25`. 안전망: 25-01 DI smoke + route-inventory.

## 🎯 Key Review Points
1. **공유 함수 > 클래스 팩토리**: 명명 클래스 유지 → DI 메타데이터(Reflector)·클래스명(route-inventory 스냅샷) 보존. 팩토리+상속은 메타/이름 깨질 위험.
2. **드롭 규율**: D2/D4 는 shape-level 중복일 뿐 substance 가 달라 묶지 않음("억지 묶기 금지").

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB → 151/151
```
**결과**: ✅ 151/151. roles/org-roles guard 단위 동작 불변, DI smoke + rbac/격리 e2e 회귀 0.

## 📦 Files Changed
### 🆕 New
- `packages/nestjs/auth/src/roles-guard.util.ts` (`checkRoles`)
### 🛠 Modified
- `packages/nestjs/auth/src/roles.guard.ts` · `org-roles.guard.ts`

## ✅ Definition of Done
- [x] D6 공유 함수, export/동작/클래스명 보존
- [x] D2·D4 드롭 명문화, 회귀 0
- [x] lint/typecheck/test PASS

## 🔗 관련
- 감사 §D, ADR-0015 (어댑터 독립), spec-25-01 DI smoke
