# Implementation Plan: spec-09-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-09-01-auth-adr`
- 시작 지점: `phase-09-login-admin` (Phase base branch)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> docs-only spec. 코드 변경 없음. 검토 항목 없음.

## 🎯 핵심 전략

### 주요 결정

| ADR | 타입 | 핵심 내용 |
|:---|:---|:---|
| **ADR-0017** | convention | `AuthProvider` sdk prop = `CoreAuthSDK` only. MFA/Passkey 훅은 별도 파라미터. |
| **ADR-0018** | decision | auth React/browser 패키지 → `packages/frontend/` (framework-agnostic 목적). `packages/react/` 불채택 이유 포함. |

### 📑 ADR 후보

- [ ] 없음 (본 spec이 ADR 작성)

## 📂 Proposed Changes

### [docs/decisions]

#### [NEW] `docs/decisions/ADR-0017-auth-provider-sdk-prop-contract.md`

AuthProvider sdk prop 타입 컨벤션.

```markdown
---
id: ADR-0017
type: convention
date: 2026-05-22
status: accepted
---
# ADR-0017: AuthProvider sdk prop은 CoreAuthSDK만 요구한다

Context: phase-08에서 AuthSDK(full) → CoreAuthSDK(5 메서드)로 축소.
Decision: AuthProvider는 CoreAuthSDK만 요구. MFA/Passkey는 각 훅이 별도 파라미터로 수신.
```

#### [NEW] `docs/decisions/ADR-0018-auth-provider-package-location.md`

auth browser/React 패키지 위치 결정.

```markdown
---
id: ADR-0018
type: decision
date: 2026-05-22
status: accepted
---
# ADR-0018: auth browser 패키지는 packages/frontend/ 카테고리에 위치한다

Context: ADR-0015에서 packages/nestjs/, packages/react/ framework 카테고리 추가.
Decision: auth-react, auth-firebase, auth-supabase, auth-testing은 packages/frontend/ 사용.
이유: framework adapter(react) 아닌 browser-target 유틸리티. firebase/supabase는 React-agnostic.
```

## 🧪 검증 계획

### 수동 검증
1. ADR-0017 파일 존재 + frontmatter type: convention 확인
2. ADR-0018 파일 존재 + frontmatter type: decision 확인
3. `pnpm -r typecheck` PASS (문서 변경이므로 타입 영향 없음)

## 🔁 Rollback Plan

- docs 파일만 → `git revert` 또는 삭제

## 📦 Deliverables 체크

- [x] task.md 작성 (이 파일과 함께)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
