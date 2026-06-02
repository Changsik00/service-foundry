# spec-09-01: Auth 아키텍처 ADR 2개 작성

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-09-01` |
| **Phase** | `phase-09` |
| **Branch** | `spec-09-01-auth-adr` |
| **상태** | Planning |
| **타입** | Docs |
| **Integration Test Required** | no |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

spec-08-04(sdk-swap-validation) 완료 시 두 개의 ADR을 "phase-08 완료 시 함께 작성"으로 이월한 상태.

- `auth-provider-sdk-prop-contract` — AuthProvider sdk prop을 `AuthSDK` → `CoreAuthSDK`로 축소한 결정
- `auth-provider-package-location` — auth-react, auth-firebase, auth-supabase, auth-testing 패키지를 `packages/frontend/` 하위에 배치한 결정

두 결정 모두 phase-08 전반에 걸쳐 암묵적으로 적용되었으나, 코드베이스에 ADR이 없어 미래 기여자가 "왜 CoreAuthSDK인가?", "왜 frontend/ 카테고리인가?"를 알 수 없음.

### 문제점

1. `AuthProvider` prop 타입 규칙이 문서화되지 않아 추후 MFA/Passkey SDK를 주입하려는 기여자가 실수로 `AuthSDK`(full)를 요구하도록 되돌릴 수 있음
2. 패키지 위치 규칙(`packages/frontend/` vs `packages/react/`)이 모호 — ADR-0015에서 `nestjs/`, `react/` 카테고리를 추가했지만 auth 패키지는 `frontend/`에 위치하는 이유가 기록되지 않음

### 해결 방안 (요약)

ADR 템플릿에 따라 두 개의 ADR 파일을 작성하고 PR로 리뷰. 코드 변경 없음.

## 🎯 요구사항

### Functional Requirements

1. `docs/decisions/ADR-0017-auth-provider-sdk-prop-contract.md` 작성 — type: convention
   - `AuthProvider` sdk prop은 `CoreAuthSDK`(5 메서드)만 요구한다는 컨벤션 문서화
   - MFA/Passkey 훅이 각자 파라미터로 SDK를 받는 설계 이유 포함
2. `docs/decisions/ADR-0018-auth-provider-package-location.md` 작성 — type: decision
   - auth React/browser 패키지를 `packages/frontend/` 카테고리에 배치하는 결정 문서화
   - `packages/react/`(ADR-0015 framework 카테고리) 대신 `packages/frontend/`를 선택한 이유 포함

### Non-Functional Requirements

1. ADR 템플릿(`.harness-kit/agent/templates/adr.md`) 준수
2. frontmatter `type:` 필드 vocabulary 준수 (constitution §6.4)

## 🚫 Out of Scope

- 코드 변경 (ADR은 문서만)
- ADR-0015 이전 결정 재검토
- 기타 phase-08 미작성 ADR

## 📑 ADR 후보

- [ ] 없음 (본 spec 자체가 ADR 작성)

## ✅ Definition of Done

- [ ] `docs/decisions/ADR-0017-auth-provider-sdk-prop-contract.md` 작성 완료
- [ ] `docs/decisions/ADR-0018-auth-provider-package-location.md` 작성 완료
- [ ] ADR 템플릿 준수 확인 (frontmatter type: 필드 포함)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-09-01-auth-adr` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
