# Implementation Plan: spec-08-04

## 📋 Branch Strategy

- 신규 브랜치: `spec-08-04-sdk-swap-validation`
- 시작 지점: `phase-08-provider-adapters` (Phase Base Branch 모드)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `AuthProvider` prop: `sdk: AuthSDK` → `sdk: CoreAuthSDK` — `auth-react` 기존 소비처(현재 없음, web-next에 AuthProvider 미연결)에 breaking 없음. MFA/Passkey 훅은 자체 sdk 파라미터 사용으로 영향 없음.
> - [ ] `apps/web-next`에 `AuthProvider` 연결 — `createMockAuthSDK()` 기본값. 실제 Firebase config 없이 TypeScript 수준 swap 검증.

> [!WARNING]
> - [ ] 신규 의존성: `apps/web-next`에 `@repo/frontend-auth-react` + `@repo/frontend-auth-testing` 추가

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **AuthProvider prop 타입** | `CoreAuthSDK`으로 축소 | `provider.tsx`는 Core 5 메서드만 사용. MFA/Passkey 훅은 자체 param |
| **web-next 기본 SDK** | `createMockAuthSDK()` | 실 Firebase config 불필요 — 타입 검증만으로 swap 증명 가능 |
| **swap 증명 방식** | `src/lib/auth.ts` + typecheck | 단일 import 변경으로 교체 가능함을 TypeScript가 컴파일 시점에 검증 |
| **런타임 테스트** | `auth.test.ts` — CoreAuthSDK 계약 확인 | 5 메서드 존재 여부 + mock SDK 기본 동작 검증 |

### 핵심 변경 흐름

```
[auth-react] provider.tsx
  sdk: AuthSDK → sdk: CoreAuthSDK

[web-next] src/lib/auth.ts
  export const authSDK: CoreAuthSDK = createMockAuthSDK();
  // 교체: import { createFirebaseAuthSDK } from '@repo/frontend-auth-firebase';
  //       export const authSDK: CoreAuthSDK = createFirebaseAuthSDK(firebaseApp);

[web-next] src/components/providers.tsx
  <AuthProvider sdk={authSDK}>...</AuthProvider>

[web-next] src/lib/auth.test.ts
  const sdk: CoreAuthSDK = createMockAuthSDK(); // TypeScript 검증
  it("CoreAuthSDK 계약 5개 메서드 존재", () => { ... })
```

### 📑 ADR 후보

- [x] `auth-provider-sdk-prop-contract` (type: convention) — `AuthProvider`는 `CoreAuthSDK`만 요구. MFA/Passkey는 별도 훅 param. phase-08 완료 시 `auth-provider-package-location`과 함께 작성.

## 📂 Proposed Changes

### [auth-react] `packages/frontend/auth-react/src/provider.tsx`

#### [MODIFY] `sdk: AuthSDK` → `sdk: CoreAuthSDK`

```typescript
import type { CoreAuthSDK } from "@repo/auth-contracts";
// ...
interface AuthProviderProps {
  sdk: CoreAuthSDK; // ← AuthSDK에서 변경
  children: ReactNode;
}
```

### [web-next] `apps/web-next/package.json`

#### [MODIFY] 의존성 추가

```json
"dependencies": {
  "@repo/frontend-auth-react": "workspace:*",
  "@repo/frontend-auth-testing": "workspace:*"
}
```

### [web-next] `apps/web-next/src/lib/auth.ts`

#### [NEW] SDK 팩토리 — 교체 지점

```typescript
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
// Provider 교체 시: 이 import 한 줄만 변경
// import { createFirebaseAuthSDK } from "@repo/frontend-auth-firebase";
// import { createSupabaseAuthSDK } from "@repo/frontend-auth-supabase";

export const authSDK = createMockAuthSDK();
```

### [web-next] `apps/web-next/src/components/providers.tsx`

#### [MODIFY] `AuthProvider` 추가

```tsx
import { AuthProvider } from "@repo/frontend-auth-react";
import { authSDK } from "@/lib/auth";
// ...
<AuthProvider sdk={authSDK}>
  <QueryClientProvider ...>
    {children}
  </QueryClientProvider>
</AuthProvider>
```

### [web-next] `apps/web-next/src/lib/auth.test.ts`

#### [NEW] SDK 계약 + 교체 검증

```typescript
import type { CoreAuthSDK } from "@repo/auth-contracts";
import { createMockAuthSDK } from "@repo/frontend-auth-testing";

// TypeScript validates: Mock SDK satisfies CoreAuthSDK
const sdk: CoreAuthSDK = createMockAuthSDK();

describe("SDK swap validation", () => {
  it("CoreAuthSDK 5개 메서드 모두 존재", () => { ... })
  it("signIn 기본 동작 (invalid_credentials)", async () => { ... })
});
```

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter @apps/web-next test
pnpm -r typecheck
```

### 수동 검증 시나리오

1. **TypeScript swap 증명**: `src/lib/auth.ts`에서 `createMockAuthSDK()` → `createFirebaseAuthSDK(mockApp)` 교체 후 `pnpm --filter @apps/web-next typecheck` → PASS
2. **AuthProvider 연결**: `providers.tsx` 렌더 시 에러 없음

## 🔁 Rollback Plan

- `auth-react/provider.tsx`: `sdk: AuthSDK`로 되돌림 (기존 소비처 없으므로 영향 없음)
- `apps/web-next`: 추가된 파일/의존성 제거

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
