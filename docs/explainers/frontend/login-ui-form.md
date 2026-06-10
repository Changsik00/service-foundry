---
difficulty: 초
aliases: ["로그인 폼", "LoginForm", "Login UI"]
tags: [service-foundry, explainer, frontend, auth]
---

# LoginForm — Client Component + useAuth 연결 + RSC /login 페이지

> **대상**: Next.js App Router에서 인증 UI가 어떻게 구성되는지 이해하려는 개발자
> **연관 문서**: [[reference/apps/web]] · [[auth-react-provider-sdk-contract]]

## 왜 필요한가

Next.js App Router에서 `useState` / `useRouter` 같은 클라이언트 훅을 사용하는 컴포넌트는 `"use client"` 지시어가 필요하다. 반면 `/login` 라우트 자체는 서버 컴포넌트(RSC)로 유지해 페이지 메타데이터 제어와 서버 사이드 렌더링을 보존한다. `LoginForm`은 이 경계에서 Client 측 로직을 담당한다.

## 어떻게 동작하나

```mermaid
flowchart TD
    Route["app/login/page.tsx<br/>(RSC — 서버 컴포넌트)"]
    Route -->|import + render| LF["LoginForm<br/>('use client')"]

    LF -->|useAuth()| Ctx["AuthContext<br/>(signIn action)"]
    LF -->|useRouter()| Router["next/navigation"]
    LF --> State["useState<br/>email / password / error / isPending"]

    State --> Form["form onSubmit=handleSubmit"]
    Form -->|submit| HS["handleSubmit()"]
    HS -->|1. setIsPending(true)| Pending["버튼 비활성"]
    HS -->|2. signIn({email,password})| SDK["CoreAuthSDK"]
    SDK -->|result.success| Router
    Router -->|push('/')| Home["홈 리다이렉트"]
    SDK -->|!result.success| ErrorMsg["에러 메시지 렌더<br/>'이메일 또는 비밀번호가 올바르지 않습니다.'"]
    HS -->|3. setIsPending(false)| Pending
```

### RSC/Client 경계

`app/login/page.tsx`(RSC)는 레이아웃 + `<LoginForm />`만 렌더한다. 상태 관리와 인증 로직은 `LoginForm`(Client)에만 존재한다. 이 경계 덕분에 page 레벨에서 서버 사이드 기능(metadata, redirect 등)을 유지할 수 있다.

### 에러 처리

`signIn` 결과가 `{ success: false }`이면 reason과 관계없이 한국어 메시지를 `role="alert"` 요소로 렌더한다. 네트워크 에러와 잘못된 인증 정보를 동일하게 처리해 정보 노출을 최소화한다.

> ⚠️ `@testing-library/user-event`가 미설치 상태이므로 테스트에서 폼 submit을 `fireEvent.click(button)`으로 트리거한다. biome의 `noNonNullAssertion` 룰 때문에 `.closest("form")!` 대신 버튼 클릭 방식을 택했다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| `"use client"` | Next.js App Router의 Client Component 경계 지시어 |
| RSC | React Server Component — 서버에서만 실행, 상태/훅 불가 |
| `useAuth()` | AuthContext에서 `signIn` 액션을 꺼내는 훅 |
| `isPending` | 제출 처리 중 버튼 비활성화 + 텍스트 변경을 위한 로컬 상태 |
| `role="alert"` | 에러 메시지를 스크린 리더에 공지하는 ARIA 속성 |

## 동작/테스트 방법

> 🧪 **테스트**: `pnpm --filter @apps/web test` — `login-form.test.tsx` 4개 (렌더, signIn 실패 → 에러 메시지, signIn 성공 → router.push('/'), isPending 중 버튼 disabled). `createMockAuthSDK()`로 Auth를 주입하고 Next.js `useRouter`는 `vi.mock`으로 대체한다.

> 🧪 **수동 확인**: `pnpm dev` 후 `localhost:2027/login` — 이메일/비밀번호 입력, 로그인 버튼, 에러 메시지 렌더 확인.

## 마치며

LoginForm은 `useAuth()` → `signIn()` → `router.push('/')` 세 단계로 인증 흐름을 완성하는 최소 Client Component다. RSC page와의 경계 분리로 서버 컴포넌트 이점을 유지하면서 클라이언트 인터랙션을 처리한다.

## 연결된 개념

- [[auth-react-provider-sdk-contract]] — LoginForm이 의존하는 AuthProvider와 useAuth
- [[http-auth-sdk-inline]] — signIn 호출을 NestJS REST로 연결하는 createAuthSDK
- [[auth-sdk-provider-adapters]] — Mock SDK로 LoginForm 테스트를 가능하게 하는 어댑터

> 소스: spec-09-02 walkthrough · `apps/web/src/components/login-form.tsx` · `apps/web/src/app/login/page.tsx`
