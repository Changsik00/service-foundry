# Implementation Plan: spec-08-02

## 📋 Branch Strategy

- 신규 브랜치: `spec-08-02-auth-supabase`
- 시작 지점: `phase-08-provider-adapters` (Phase Base Branch 모드)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 패키지 위치: `packages/frontend/auth-supabase/` (`@repo/frontend-auth-supabase`) — spec-08-01과 동일 컨벤션 (ADR-0015). `@supabase/supabase-js`도 프론트 맥락.
> - [ ] `SupabaseExtensions.rls` — `SupabaseClient` 인스턴스 자체를 노출. RLS 쿼리는 앱 코드 책임 (SDK가 클라이언트만 제공).

> [!WARNING]
> - [ ] `@supabase/supabase-js` 신규 의존성 — `pnpm-workspace.yaml` catalog에 추가 (`^2.0.0`).

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **패키지 카테고리** | `packages/frontend/auth-supabase/` | ADR-0015: supabase-js는 브라우저/프론트 맥락 |
| **테스트 전략** | `vi.mock('@supabase/supabase-js', ...)` 전체 | 네트워크 의존 제거 + node 환경 호환 |
| **Supabase 에러 정규화** | `AuthApiError.message` 문자열 매칭 | Supabase v2: 에러 메시지가 사실상 공개 계약. `status` 코드 병행 사용 |
| **SupabaseExtensions.rls** | `SupabaseClient` 직접 노출 | RLS-aware 쿼리는 앱 레이어 책임 — SDK는 인증된 클라이언트만 제공 |
| **Session 변환** | `supabase session.expires_at` → ISO 문자열 | Supabase session의 `expires_at` (Unix timestamp) → `new Date(expires_at * 1000).toISOString()` |

### Supabase AuthApiError → AuthResult 매핑

| Supabase 에러 (`message`) | 변환 |
|---|---|
| `"Invalid login credentials"` | `{ success: false, reason: "invalid_credentials" }` |
| `"Email not confirmed"` | `{ success: false, reason: "unverified_email" }` |
| `"Email rate limit exceeded"` | `{ success: false, reason: "rate_limited" }` |
| `"User already registered"` | `AppError({ code: "CONFLICT", statusCode: 409, ... })` throw |
| 기타 AuthApiError | re-throw |

### SupabaseExtensions

```typescript
export interface SupabaseExtensions {
  rls: SupabaseClient; // 인증 세션 적용된 Supabase client — RLS 쿼리에 직접 사용
}
```

### 📑 ADR 후보

- [ ] `auth-provider-package-location` (type: convention) — spec-08-01에서 이미 후보 등록. phase-08 완료 시 작성.

## 📂 Proposed Changes

### [catalog] `pnpm-workspace.yaml`

#### [MODIFY] `@supabase/supabase-js: "^2.0.0"` 추가

### [new package] `packages/frontend/auth-supabase/`

#### [NEW] `package.json`

```json
{
  "name": "@repo/frontend-auth-supabase",
  "dependencies": {
    "@repo/auth-contracts": "workspace:*",
    "@repo/errors": "workspace:*",
    "@supabase/supabase-js": "catalog:"
  }
}
```

#### [NEW] `tsconfig.json`

- `extends: "@repo/typescript-config/base"`
- `lib: ["ES2023", "DOM"]` — supabase-js + 의존성 체인이 DOM 글로벌 참조

#### [NEW] `vitest.config.ts`

- `nodePreset` from `@repo/vitest-config/node`

#### [NEW] `src/normalize.ts` — AuthApiError → AuthResult / AppError 변환

```typescript
export function normalizeSupabaseAuthError(err: unknown): AuthResult {
  // isSupabaseAuthError 체크 후 message 매칭
  // CONFLICT → throw AppError, 나머지 → AuthResult 반환
}
```

#### [NEW] `src/index.ts` — createSupabaseAuthSDK

```typescript
export interface SupabaseConfig { url: string; anonKey: string; }
export interface SupabaseExtensions { rls: SupabaseClient; }

export function createSupabaseAuthSDK(
  config: SupabaseConfig,
): CoreAuthSDK & { supabase: SupabaseExtensions }
```

#### [NEW] `src/normalize.test.ts` — 에러 정규화 단위 테스트

#### [NEW] `src/index.test.ts` — Core Surface 단위 테스트 (vi.mock @supabase/supabase-js)

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter frontend-auth-supabase test
pnpm -r typecheck
```

### 수동 검증 시나리오

1. **signIn 성공**: mock `signInWithPassword` → `{ data: { user, session }, error: null }` → `AuthResult { success: true }`
2. **signIn 실패**: mock → error `"Invalid login credentials"` → `AuthResult { success: false, reason: "invalid_credentials" }`
3. **signUp email 중복**: mock → error `"User already registered"` → `AppError({ code: "CONFLICT" })` throw
4. **getCurrentUser null**: `getUser()` → `{ data: { user: null } }` → `null`
5. **refresh**: `refreshSession()` → `Session` 반환
6. **supabase.rls 노출**: `sdk.supabase.rls` === createClient 반환값 확인

## 🔁 Rollback Plan

- `packages/frontend/auth-supabase/`: 신규 디렉토리 삭제로 충분
- `pnpm-workspace.yaml` catalog: `@supabase/supabase-js` 항목 삭제
- `auth-contracts` 변경 없음 (기존 `CoreAuthSDK` 재사용)

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
