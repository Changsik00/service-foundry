# Implementation Plan: spec-19-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-01-account-mutations-api`
- 시작 지점: `phase-19-account-authz` (phase base branch)
- PR 타깃: `phase-19-account-authz`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 탈퇴 시 이메일 마스킹 방식 동의 (`<email>#deleted_<uuid>` — unique 제약 우회, 동일 이메일 재가입 허용)
> - [ ] 비밀번호 변경 후 기존 세션 유지 방침 동의 (세션 강제 종료 없음 — 보안 강화는 spec-19-03에서)

> [!WARNING]
> - [ ] DB 마이그레이션 포함 — `users` 테이블 컬럼 2개 추가 (`display_name`, `deleted_at`). nullable 컬럼만 추가 → 무중단.

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **삭제 방식** | soft-delete (`deleted_at`) | 세션 revoke + 감사 이력 보존; hard delete는 FK cascade 복잡 |
| **이메일 unique 우회** | 탈퇴 시 email을 `<email>#deleted_<uuid>`로 마스킹 | unique 제약 유지하면서 동일 이메일 재가입 허용 |
| **비밀번호 변경 후 세션** | 기존 세션 유지 | UX 우선; 전체 로그아웃은 spec-19-03에서 사용자가 직접 수행 |
| **컨트롤러** | 신규 `AccountController` | 기존 `AuthController`와 관심사 분리 (인증 vs 계정 변경) |
| **UserStore** | `apps/api/src/infra/user.store.ts` 신규 | API 레이어 전용; 기존 password-reset 패키지 UserStore와 별개 |
| **revokeAllByUser** | `packages/backend/auth-session` 확장 | 탈퇴 시 전체 세션 무효화; 기존 `revokeSession` 패턴 연장 |

### ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [DB 마이그레이션]

#### [NEW] `apps/api/src/infra/migrations/0009_account_fields.sql`

```sql
ALTER TABLE users
  ADD COLUMN display_name TEXT,
  ADD COLUMN deleted_at TIMESTAMPTZ;
```

#### [MODIFY] `apps/api/src/infra/schema/users.ts`

- `displayName: text("display_name")` 추가
- `deletedAt: timestamp("deleted_at", { withTimezone: true })` 추가

### [UserStore]

#### [NEW] `apps/api/src/infra/user.store.ts`

```typescript
// API 레이어 전용 UserStore
findById(id: string): Promise<UserRow | null>
updatePasswordHash(id: string, hash: string): Promise<void>
updateDisplayName(id: string, name: string): Promise<void>
softDelete(id: string, maskedEmail: string): Promise<void>
```

### [SessionStore 확장]

#### [MODIFY] `packages/backend/auth-session/src/`

- `revokeAllByUser(userId: string): Promise<void>` 추가
  - `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`

### [AccountService]

#### [NEW] `apps/api/src/auth/account.service.ts`

```typescript
changePassword(userId, currentPassword, newPassword): Promise<void>
  // findById → verifyPassword → hashPassword → updatePasswordHash
  // 틀리면 throw AppError(INVALID_CREDENTIALS) or 401

updateProfile(userId, displayName): Promise<void>
  // updateDisplayName

deleteAccount(userId): Promise<void>
  // memberships에서 sole owner 검증 → 있으면 throw AppError(ACCOUNT_DELETE_BLOCKED)
  // softDelete(userId, `${email}#deleted_${crypto.randomUUID()}`)
  // SessionStore.revokeAllByUser(userId)
```

### [AccountController]

#### [NEW] `apps/api/src/auth/account.controller.ts`

```
POST /auth/account/password   — @UseGuards(AuthGuard)
PATCH /auth/account/profile   — @UseGuards(AuthGuard)
DELETE /auth/account          — @UseGuards(AuthGuard, CsrfGuard)
```

#### [MODIFY] `apps/api/src/auth/auth.module.ts`

- `AccountService`, `AccountController` providers/controllers 등록

### [GET /auth/me 확장]

#### [MODIFY] `apps/api/src/auth/auth.controller.ts` (또는 me 응답 DTO)

- me 응답에 `displayName` 포함

### [e2e 테스트]

#### [NEW] `apps/api/src/auth/account.e2e.test.ts`

5종 테스트 케이스:
1. `POST /auth/account/password` — 현재 비밀번호 틀림 → 400/401
2. `POST /auth/account/password` — 성공 → 200 + 새 비밀번호로 로그인 성공
3. `PATCH /auth/account/profile` — `displayName` 변경 → `GET /auth/me`에 반영 확인
4. `DELETE /auth/account` — sole owner 존재 → 400 `ACCOUNT_DELETE_BLOCKED`
5. `DELETE /auth/account` — 정상 탈퇴 → 200 + 세션 무효화 (401 응답) 확인

## 🧪 검증 계획

```bash
# e2e 테스트
pnpm --filter @apps/api test:e2e -- --testPathPattern="account.e2e"

# 타입 검사
pnpm turbo run typecheck
```

## 🔁 Rollback Plan

- 마이그레이션: nullable 컬럼 추가만 → rollback: `ALTER TABLE users DROP COLUMN display_name, DROP COLUMN deleted_at`
- 신규 파일 삭제, `auth.module.ts` 등록 제거, SessionStore `revokeAllByUser` 제거

## 📦 Deliverables 체크

- [x] spec.md 작성
- [x] plan.md 작성 (이 파일)
- [ ] task.md 작성
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
