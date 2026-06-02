# Implementation Plan: spec-09-03

## 📋 Branch Strategy

- 신규 브랜치: `spec-09-03-http-auth-sdk`
- 시작 지점: `phase-09-login-admin`
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `getCurrentUser()`는 네트워크 호출 없이 in-memory 캐시만 사용. 페이지 새로고침 시 user = null. → 이 동작이 acceptable한지 확인.
> - [ ] NestJS API 기본 포트 = `3001`. `createHttpAuthSDK("http://localhost:3001")`로 web-next auth.ts 교체.

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **패키지 위치** | `packages/frontend/auth-http` | ADR-0018: auth browser 패키지는 packages/frontend/ |
| **토큰 관리** | in-memory (signIn/signUp/refresh 후 저장) | httpOnly cookie = 브라우저가 자동 관리. accessToken만 메모리에. |
| **getCurrentUser** | in-memory 반환 (네트워크 없음) | 5개 CoreAuthSDK 메서드 중 가장 빈번히 호출. 새로고침 시 null → refresh()로 복구. |
| **HTTP 에러 처리** | 상태코드 기반 reason 매핑 | 401→invalid_credentials, 429→rate_limited, 나머지 4xx/5xx→invalid_credentials |
| **테스트 방법** | `vi.stubGlobal('fetch', vi.fn())` | msw 미설치 — vitest global fetch mock으로 충분 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [NEW] `packages/frontend/auth-http/`

#### `packages/frontend/auth-http/package.json`

```json
{
  "name": "@repo/frontend-auth-http",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "default": "./src/index.ts" } },
  "dependencies": { "@repo/auth-contracts": "workspace:*" },
  "devDependencies": { ...biome, typescript, vitest... }
}
```

#### `packages/frontend/auth-http/src/index.ts`

```typescript
import type { AuthResult, CoreAuthSDK, Session, User } from "@repo/auth-contracts";

export function createHttpAuthSDK(baseUrl: string): CoreAuthSDK {
  let currentUser: User | null = null;

  async function post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",          // refresh token cookie 전송
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw Object.assign(new Error(), { status: res.status });
    return res.json() as Promise<T>;
  }

  return {
    async signIn(input): Promise<AuthResult> {
      try {
        const data = await post<{ accessToken: string; user: User } |
                                { status: "mfa_required" }>("auth/signin", input);
        if ("status" in data && data.status === "mfa_required") {
          return { success: false, reason: "mfa_required", challenge: { challengeId: "", method: "totp", expiresAt: "" } };
        }
        currentUser = (data as { user: User }).user;
        return { success: true, user: currentUser, session: { userId: currentUser.id, expiresAt: "" } };
      } catch (err) {
        return { success: false, reason: httpReason(err) };
      }
    },
    async signUp(input): Promise<AuthResult> { /* POST /auth/signup */ },
    async signOut(): Promise<void> { /* POST /auth/signout; currentUser = null; */ },
    async getCurrentUser(): Promise<User | null> { return currentUser; },
    async refresh(): Promise<Session | null> { /* POST /auth/refresh */ },
  };
}

function httpReason(err: unknown): "invalid_credentials" | "rate_limited" {
  const status = (err as { status?: number }).status;
  if (status === 429) return "rate_limited";
  return "invalid_credentials";
}
```

#### `packages/frontend/auth-http/src/index.test.ts`

테스트 케이스:
1. signIn 성공 → user 저장 + AuthResult success 반환
2. signIn 실패 (401) → `{ success: false, reason: 'invalid_credentials' }`
3. signIn 실패 (429) → `{ success: false, reason: 'rate_limited' }`
4. getCurrentUser — 초기값 null
5. getCurrentUser — signIn 성공 후 user 반환
6. signOut → getCurrentUser null 초기화
7. refresh 성공 → session 반환 + user 갱신
8. signUp 성공 → user 저장 + AuthResult success 반환

### [MODIFY] `apps/web-next/src/lib/auth.ts`

```typescript
import { createHttpAuthSDK } from "@repo/frontend-auth-http";
export const authSDK = createHttpAuthSDK("http://localhost:3001");
```

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @repo/frontend-auth-http test
```

### 타입 체크

```bash
pnpm -r typecheck
```

### 수동 검증 시나리오

1. `pnpm -r typecheck` PASS — CoreAuthSDK 계약 충족 확인 (SDK swap validation)

## 🔁 Rollback Plan

- `auth-http` 패키지 삭제 + `apps/web-next/src/lib/auth.ts` → `createMockAuthSDK()`로 복구

## 📦 Deliverables 체크

- [x] task.md 작성
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
