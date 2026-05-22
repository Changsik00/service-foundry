# docs(spec-09-01): ADR-0017 + ADR-0018 auth 아키텍처 결정 기록

## 📋 Summary

### 배경 및 목적

phase-08(spec-08-04) 완료 시 "phase-08 종료 후 작성"으로 이월한 ADR 2개를 작성합니다. 두 결정 모두 phase-08 전반에 걸쳐 암묵적으로 적용되었으나 코드베이스에 기록이 없어 미래 기여자가 이유를 알 수 없는 상태였습니다.

### 주요 변경 사항

- [x] `docs/adr/0017-auth-provider-sdk-prop-contract.md` — AuthProvider sdk prop = CoreAuthSDK 컨벤션 (type: convention)
- [x] `docs/adr/0018-auth-provider-package-location.md` — auth browser 패키지를 packages/frontend/ 에 배치하는 결정 (type: decision)

### Phase 컨텍스트

- **Phase**: `phase-09`
- **본 SPEC 의 역할**: phase-09 첫 spec. phase-08 이월 ADR 정리로 auth 아키텍처 문서화 완성. 이후 로그인 UI(spec-09-02) + HTTP auth SDK(spec-09-03)의 설계 근거를 ADR로 뒷받침.

## 🎯 Key Review Points

1. **ADR-0017 타입 = convention**: `AuthProvider` sdk prop 규칙은 단발 결정이 아닌 반복 적용되는 구조 규칙 → convention 적합. 향후 `auth-react` 변경 시 이 ADR 확인 필수.
2. **ADR-0018: packages/react/ 미사용 이유**: `auth-firebase`, `auth-supabase`, `auth-testing`은 React-agnostic. `auth-react`도 Core 계약의 React 바인딩이지 React framework adapter가 아님 → `packages/frontend/` 배치.

## 🧪 Verification

### 자동 테스트

```bash
pnpm -r typecheck
```

**결과 요약**:
- ✅ 39 packages typecheck PASS — 문서 변경만

## 📦 Files Changed

### 🆕 New Files

- `docs/adr/0017-auth-provider-sdk-prop-contract.md`: AuthProvider sdk prop 컨벤션 ADR
- `docs/adr/0018-auth-provider-package-location.md`: auth browser 패키지 위치 결정 ADR
- `specs/spec-09-01-auth-adr/spec.md`, `plan.md`, `task.md`, `walkthrough.md`, `pr_description.md`: spec 산출물

**Total**: 7 files changed (docs-only)

## ✅ Definition of Done

- [x] ADR-0017 작성 완료 (type: convention, status: accepted)
- [x] ADR-0018 작성 완료 (type: decision, status: accepted)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] pnpm -r typecheck PASS (39 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-09.md`
- Walkthrough: `specs/spec-09-01-auth-adr/walkthrough.md`
- 관련 ADR: `docs/adr/0006-auth-strategy.md`, `docs/adr/0015-framework-adapter-naming-and-layout.md`
