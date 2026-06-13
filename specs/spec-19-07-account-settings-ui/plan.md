# Implementation Plan: spec-19-07 계정 설정 UI

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-07-account-settings-ui`
- 시작 지점: `phase-19-account-authz`

## 🎯 핵심 전략

### 기존 코드 재사용

| 항목 | 현황 | 이번 추가 |
|---|---|---|
| `SessionsCard.tsx` | 대시보드에서 사용 중 | `/account` 보안 탭에 재사용 |
| `queries.ts` | `accountQueries.me()`, session 쿼리 | `displayName` 필드 추가 + `mutations.ts` 신규 분리 |
| `httpClient` | `auth: source` 자동 토큰 주입 | 그대로 사용 — CSRF만 수동 획득 |

### CSRF 처리 패턴

`DELETE /auth/account`는 CsrfGuard를 통과해야 한다. 별도 CSRF 상태 없이 mutation 실행 시점에 `GET /auth/csrf`를 호출해 토큰을 얻는 인라인 패턴을 쓴다:

```ts
// useDeleteAccount 훅 내부
const { token } = await httpClient.get("/auth/csrf", { schema: CsrfSchema });
await httpClient.delete("/auth/account", {
  requiresAuth: true,
  headers: { "X-Csrf-Token": token },
});
```

이 패턴은 auth-api.ts의 `withCsrfRetry` 로직을 복사하지 않고 단순하게 유지한다.

### 탭 구조

URL 파라미터 없이 React 로컬 state(`useState`)로 탭 전환. 브라우저 뒤로가기 시 탭이 유지될 필요 없음.

## 📂 변경 파일

### [NEW] `apps/web/src/features/account/mutations.ts`

account 변경 뮤테이션 훅 모음.

```ts
// 내보낼 훅
export function useUpdateProfile(): UseMutationResult<...>
export function useChangePassword(): UseMutationResult<...>
export function useDeleteAccount(): UseMutationResult<...>
```

- `useUpdateProfile` — `PATCH /auth/account/profile`, 성공 시 `["auth", "me"]` 무효화
- `useChangePassword` — `PATCH /auth/account/password`, 성공 시 폼 리셋
- `useDeleteAccount` — CSRF 취득 후 `DELETE /auth/account`, 성공 시 로그아웃 (`auth.signOut()`)

### [MODIFY] `apps/web/src/features/account/queries.ts`

`MeSchema`에 `displayName: z.string().nullable()` 필드 추가.

### [NEW] `apps/web/src/features/account/ProfileForm.tsx`

```tsx
// Props
interface ProfileFormProps {}

// 동작
// 1. useQuery(accountQueries.me()) 로 현재 displayName prefill
// 2. input onChange → 로컬 state
// 3. submit → useUpdateProfile()
// 4. 에러 → 폼 하단 인라인 에러 메시지
```

### [NEW] `apps/web/src/features/account/PasswordForm.tsx`

```tsx
// 필드: currentPassword / newPassword / confirmPassword
// 검증: newPassword === confirmPassword (클라이언트), 최소 8자
// submit → useChangePassword()
// 에러(401): "현재 비밀번호가 틀렸습니다"
```

### [NEW] `apps/web/src/features/account/DeleteSection.tsx`

```tsx
// "계정 삭제" 버튼 → window.confirm 또는 인라인 확인 UI
// 확인 후 useDeleteAccount() → 성공 시 auth.signOut()
```

### [MODIFY] `apps/web/src/features/account/index.ts`

`ProfileForm`, `PasswordForm`, `DeleteSection` re-export 추가.

### [NEW] `apps/web/src/app/(console)/account/page.tsx`

```tsx
"use client";
// 탭: "프로필" | "보안"
// 프로필 탭: ProfileForm
// 보안 탭: PasswordForm + SessionsCard + DeleteSection
```

### [MODIFY] `apps/web/src/components/sidebar.tsx`

```ts
const NAV = [
  { href: "/", label: "대시보드" },
  { href: "/members", label: "멤버" },
  { href: "/account", label: "계정 설정" },  // 추가
] as const;
```

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @apps/web exec vitest run src/features/account/ProfileForm.test.tsx
pnpm --filter @apps/web exec vitest run src/features/account/PasswordForm.test.tsx
```

테스트 대상:
- `ProfileForm` — submit 시 `useUpdateProfile` 호출, 에러 시 메시지 노출
- `PasswordForm` — confirm 불일치 시 클라이언트 에러, submit 시 훅 호출

### 수동 검증 시나리오

1. `/account` 접속 → 프로필 탭 기본 표시, 현재 displayName prefill 확인
2. 이름 변경 → 저장 → 대시보드 `AccountCard` 반영 확인
3. 보안 탭 → 비밀번호 변경 → 로그아웃 후 새 비밀번호로 로그인 확인
4. 보안 탭 → 계정 삭제 → 확인 → 로그아웃 확인

## 🔁 Rollback Plan

- 프론트 전용 변경 — API 건드리지 않으므로 브랜치 삭제로 완전 롤백
- `sidebar.tsx`에서 링크 제거 시 사용자에게 `/account`가 노출되지 않음

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
