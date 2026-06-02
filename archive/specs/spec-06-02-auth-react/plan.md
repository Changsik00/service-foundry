# Implementation Plan: spec-06-02 — React 인증 어댑터

## 📋 Branch Strategy

- 신규 브랜치: `spec-06-02-auth-react`
- 시작 지점: `phase-06-auth-integration`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **`AuthSDK` 위치**: `auth-contracts` 에 추가. 이유: future `auth-firebase` / `auth-supabase` 패키지가 구현할 때 `auth-react` 에 의존하면 역방향 의존. 공유 contracts 에 놓는 것이 자연스럽다.
> - [ ] **auth 상태 모델**: `{ user: User | null; isLoading: boolean }`. Session 은 signIn 반환값에만 존재하고 Provider 가 별도 추적하지 않음 (Cookie 전략은 spec-06-03). `useSession()` 은 user 상태의 read-only alias.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
packages/
  shared/auth-contracts/src/index.ts   ← AuthSDK interface 추가
  frontend/auth-react/
    src/
      context.ts      ← AuthContext 타입 + createContext
      provider.tsx    ← <AuthProvider sdk={sdk}>
      hooks.ts        ← useAuth() / useSession()
      guards.tsx      ← <RequireAuth> / <RequireRole>
      index.ts        ← public exports
      provider.test.tsx
      guards.test.tsx
    package.json
    tsconfig.json
    vitest.config.ts
    vitest.setup.ts
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **AuthSDK 위치** | `auth-contracts` | future auth-firebase 패키지가 auth-react 역방향 의존 방지 |
| **상태 모델** | `{ user, isLoading }` | Session 관리는 Cookie 전략(spec-06-03) 이후 결정. YAGNI. |
| **useSession()** | user 상태의 read-only wrapper | 사용처 혼용 방지 — `useAuth` 는 action 포함, `useSession` 은 읽기 전용 |
| **RequireAuth 동작** | isLoading/미인증 → fallback | redirect 는 앱 레벨 결정 (Next.js/TanStack), 패키지는 null/fallback만 |
| **테스트 환경** | jsdom + @testing-library/react | frontend/ui 와 동일 패턴 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### 1. `auth-contracts` 확장

#### [MODIFY] `packages/shared/auth-contracts/src/index.ts`
`AuthSDK` interface 추가:
```ts
export type Unsubscribe = () => void;

export interface AuthSDK {
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  refresh(): Promise<Session | null>;
}
```

### 2. 신규 패키지: `packages/frontend/auth-react/`

#### [NEW] `packages/frontend/auth-react/package.json`
`@repo/frontend-auth-react`. peerDep: `react ^19.0.0`. dep: `@repo/auth-contracts`. devDep: `@testing-library/react` + jsdom + vitejs/plugin-react.

#### [NEW] `packages/frontend/auth-react/tsconfig.json`
`jsx: "preserve"` + `lib: ["DOM", "DOM.Iterable", "ES2023"]`.

#### [NEW] `packages/frontend/auth-react/vitest.config.ts`
`reactPreset` + `@vitejs/plugin-react`.

#### [NEW] `packages/frontend/auth-react/vitest.setup.ts`
`@testing-library/jest-dom/vitest` + `cleanup` (frontend/ui 패턴 동일).

#### [NEW] `packages/frontend/auth-react/src/context.ts`
```ts
export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  refresh(): Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
```

#### [NEW] `packages/frontend/auth-react/src/provider.tsx`
```tsx
export function AuthProvider({ sdk, children }: { sdk: AuthSDK; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sdk.getCurrentUser()
      .then(u => { setUser(u); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [sdk]);

  const signIn = async (input) => { const r = await sdk.signIn(input); if (r.success) setUser(r.user); return r; };
  const signOut = async () => { await sdk.signOut(); setUser(null); };
  const signUp = async (input) => { const r = await sdk.signUp(input); if (r.success) setUser(r.user); return r; };
  const refresh = async () => { await sdk.refresh(); };

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signUp, refresh }}>{children}</AuthContext.Provider>;
}
```

#### [NEW] `packages/frontend/auth-react/src/hooks.ts`
```ts
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
export function useSession() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
```

#### [NEW] `packages/frontend/auth-react/src/guards.tsx`
```tsx
export function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <>{fallback}</>;
  return <>{children}</>;
}

export function RequireRole({ role, children, fallback = null }: { role: Role; children: ReactNode; fallback?: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading || !user || user.role !== role) return <>{fallback}</>;
  return <>{children}</>;
}
```

#### [NEW] 테스트 파일
- `src/provider.test.tsx` — AuthProvider + useAuth + useSession (6케이스)
- `src/guards.test.tsx` — RequireAuth + RequireRole (6케이스)

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @repo/frontend-auth-react exec vitest run
```

### 타입 체크

```bash
pnpm typecheck
```

## 🔁 Rollback Plan

- `packages/frontend/auth-react/` 신규 패키지 — 삭제로 완전 롤백.
- `auth-contracts` 의 `AuthSDK` 추가는 additive (기존 사용처 영향 없음).

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
