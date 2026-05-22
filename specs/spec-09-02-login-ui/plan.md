# Implementation Plan: spec-09-02

## 📋 Branch Strategy

- 신규 브랜치: `spec-09-02-login-ui`
- 시작 지점: `phase-09-login-admin` (Phase base branch)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] LoginForm은 Mock SDK로 동작. signIn 기본값 = `{ success: false, reason: "invalid_credentials" }`. 성공 테스트는 `createMockAuthSDK({ signInResult: { success: true, ... } })`로 초기화.

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **LoginForm 상태** | `useState` (email, password, error, isPending) | 외부 상태 라이브러리 불필요 — 단순 폼 |
| **리다이렉트** | `useRouter().push('/')` | Next.js App Router 표준. 서버 redirect는 Client Component에서 불가. |
| **에러 메시지** | reason 무관하게 단일 메시지 | UX best practice — "어느 필드가 틀렸는지" 노출하지 않음 |
| **테스트 mock** | `vi.mock('next/navigation')` + AuthProvider 래핑 | useRouter는 next/navigation 의존. AuthProvider는 실제 구현체 사용. |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [web-next]

#### [NEW] `apps/web-next/src/components/login-form.tsx`

```tsx
"use client";
import { useAuth } from "@repo/frontend-auth-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const result = await signIn({ email, password });
    setIsPending(false);
    if (result.success) {
      router.push("/");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required />
      <button type="submit" disabled={isPending}>{isPending ? "로그인 중..." : "로그인"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

#### [NEW] `apps/web-next/src/app/login/page.tsx`

```tsx
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">로그인</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

#### [NEW] `apps/web-next/src/components/login-form.test.tsx`

테스트 케이스:
1. 이메일 + 비밀번호 입력 필드 + 로그인 버튼 렌더
2. 제출 시 signIn({ email, password }) 호출 확인
3. signIn 실패 → 에러 메시지 표시
4. signIn 성공 → router.push('/') 호출

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter @apps/web-next test
```

### 수동 검증 시나리오

1. `pnpm --filter @apps/web-next dev` → localhost:2027/login 접속 → LoginForm 렌더 확인
2. 임의 이메일/비밀번호 입력 후 제출 → "이메일 또는 비밀번호가 올바르지 않습니다." 에러 표시 확인 (Mock SDK 기본 동작)

## 🔁 Rollback Plan

- 신규 파일만 (login-form.tsx, login/page.tsx, login-form.test.tsx) → 삭제로 롤백

## 📦 Deliverables 체크

- [x] task.md 작성
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
