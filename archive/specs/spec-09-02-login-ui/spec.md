# spec-09-02: 로그인 UI 페이지 (web-next)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-09-02` |
| **Phase** | `phase-09` |
| **Branch** | `spec-09-02-login-ui` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- `apps/web-next`에 `AuthProvider`가 연결됨 (createMockAuthSDK, spec-08-04)
- `useAuth()` 훅으로 `signIn()` 등 Core 5 메서드에 접근 가능
- `/login` 라우트 없음 — 사용자가 로그인할 수 있는 UI가 존재하지 않음

### 문제점

AuthProvider가 연결되어 있어도 로그인 페이지가 없으면 인증 플로우를 시작할 방법이 없음. phase-09의 핵심 목표("브라우저에서 로그인")를 달성하려면 UI가 필요.

### 해결 방안 (요약)

`LoginForm` Client Component를 작성하고 `/login` 라우트에 배치한다. `useAuth().signIn()`을 호출해 성공 시 `/`로 리다이렉트, 실패 시 에러 메시지를 표시한다. 현재 Mock SDK 상태에서 동작 확인.

## 📊 개념도

```mermaid
flowchart LR
    User["사용자\n/login"] -->|submit| LF["LoginForm\n(Client Component)"]
    LF -->|useAuth().signIn()| AP["AuthProvider\n(Context)"]
    AP -->|signIn()| SDK["authSDK\n(createMockAuthSDK)"]
    SDK -->|result| AP
    AP -->|AuthResult| LF
    LF -->|success → router.push('/')| Home["/"]
    LF -->|failure → error msg| LF
```

## 🎯 요구사항

### Functional Requirements

1. `apps/web-next/src/components/login-form.tsx` — LoginForm Client Component
   - 이메일 + 비밀번호 입력 필드
   - 로그인 버튼 (제출 중 비활성화 + "로그인 중..." 텍스트)
   - `useAuth().signIn({ email, password })` 호출
   - 성공(`result.success === true`) → `router.push('/')`
   - 실패 → "이메일 또는 비밀번호가 올바르지 않습니다." 에러 메시지 표시
2. `apps/web-next/src/app/login/page.tsx` — /login Server Component
   - LoginForm 렌더링

### Non-Functional Requirements

1. `pnpm --filter @apps/web-next test` PASS (단위 테스트 포함)
2. `pnpm -r typecheck` PASS (39+ packages)

## 🚫 Out of Scope

- 실제 NestJS 백엔드 연결 (spec-09-03)
- 로그인 보호 라우트 (미들웨어/guard)
- 회원가입 UI
- 스타일링 (Tailwind 최소한 적용, 디자인 완성도 불필요)

## 📑 ADR 후보

- [ ] 없음

## ✅ Definition of Done

- [ ] `pnpm --filter @apps/web-next test` PASS (LoginForm 테스트 포함)
- [ ] `pnpm -r typecheck` PASS
- [ ] `/login` 라우트 → LoginForm 렌더 확인 (dev 서버)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-09-02-login-ui` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
