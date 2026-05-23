---
id: ADR-0018
type: decision
date: 2026-05-22
status: accepted
---

# ADR-0018: auth browser 패키지는 packages/frontend/ 카테고리에 위치한다

## 📚 Context

ADR-0015에서 framework adapter 패키지를 위한 카테고리가 추가되었다:

```
packages/
  backend/   — framework-agnostic backend core (ADR-0015 이전)
  nestjs/    — NestJS 전용 adapter (ADR-0015 신규)
  react/     — React 전용 adapter (ADR-0015 신규)
  frontend/  — browser-target 유틸리티 (ADR-0015 이전, auth-http-client 등)
  shared/    — 플랫폼 무관 공유 코드 (ADR-0015 이전)
```

phase-08(spec-08-01~04)에서 auth browser 패키지 4개가 신규 생성되었다:

| 패키지 | 위치 | React 의존 |
|---|---|---|
| `auth-react` | `packages/frontend/auth-react` | ✅ (React Context/Hooks 사용) |
| `auth-firebase` | `packages/frontend/auth-firebase` | ❌ |
| `auth-supabase` | `packages/frontend/auth-supabase` | ❌ |
| `auth-testing` | `packages/frontend/auth-testing` | ❌ |

`auth-react`는 React를 직접 사용하므로, ADR-0015에서 추가된 `packages/react/` 카테고리로 이동하는 것이 자연스럽다는 의문이 생긴다.

## ✅ Decision

```
auth browser 패키지 = packages/frontend/ 유지
packages/react/     = React framework-specific adapters 전용 (NestJS 모듈 패턴의 React 등가물)
```

`auth-react`, `auth-firebase`, `auth-supabase`, `auth-testing` 은 모두 `packages/frontend/` 카테고리에 위치한다.

**판단 기준**:

- `packages/react/` 는 *React framework adapter* 전용 — NestJS adapter 패턴의 React 등가물 (예: React Query provider wrapper, React 라우터 통합). 특정 React 버전/생태계 패턴에 강하게 결합된 패키지.
- `packages/frontend/` 는 *browser-target 유틸리티* — React 유무와 관계없이 브라우저에서 동작하는 패키지. auth-firebase, auth-supabase, auth-testing은 React-agnostic. auth-react도 특정 React framework adapter가 아닌 Core auth 계약의 React 바인딩.

## 🎯 Consequences

### 장점

- **auth-firebase, auth-supabase, auth-testing 위치 명확**: React 의존 없는 세 패키지가 React 카테고리에 들어가지 않아 분류 혼란 없음.
- **카테고리 일관성**: `packages/react/`는 진정한 React framework adapters 전용으로 유지.
- **확장성**: 향후 `auth-vue`, `auth-solid` 등 다른 프레임워크 바인딩도 `packages/frontend/` 에 자연스럽게 추가 가능.

### 단점

- **auth-react 위치 비직관적**: React를 사용하는 패키지가 `packages/frontend/`에 있어 첫 기여자에게 의아할 수 있음 → 본 ADR로 이유를 문서화.

## 🔁 Alternatives Considered

| 옵션 | 무엇 | 거부 사유 |
|---|---|---|
| **A. auth-react를 packages/react/로 이동** | React 의존 기준으로 분류 | auth-firebase/supabase/testing은 여전히 frontend/. 불일관. auth-react가 framework adapter 아닌 Core 계약 바인딩임을 반영 못함. |
| **B. 4개 모두 packages/react/로 이동** | auth 패키지 통합 | React-agnostic 패키지 3개(firebase/supabase/testing)가 React 카테고리에 들어가 오분류. |
| **C. packages/frontend/ 유지 (채택)** | 현재 위치 그대로 | auth-firebase/supabase/testing의 React-agnostic 특성 보존 + auth-react는 Core 계약 바인딩으로 분류. 카테고리 의미 명확. |

## 🔁 Revisit Triggers

- `packages/react/` 에 실제 React framework adapter 패키지가 추가되어 `auth-react` 와 분류 비교가 필요해지는 시점
- `auth-react`가 React 에코시스템 기능(Server Components, RSC, React Router 통합 등)에 강하게 결합되는 경우

## 📚 관련 문서

- [ADR-0015](./0015-framework-adapter-naming-and-layout.md) — Framework adapter 카테고리/명명 (`packages/react/` 신규 추가)
- [ADR-0017](./0017-auth-provider-sdk-prop-contract.md) — AuthProvider sdk prop 컨벤션
- `packages/frontend/auth-react/` — 본 ADR 적용 패키지
