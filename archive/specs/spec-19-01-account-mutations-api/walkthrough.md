# Walkthrough: spec-19-01

## 커밋 이력

```
062fc5c feat(spec-19-01): users 마이그레이션 + AccountUserStore + revokeAllByUser
f0ec2d3 feat(spec-19-01): AccountService + AccountController + e2e 5종 Green
```

## Task 1: DB 마이그레이션 + Store 확장

### 마이그레이션 (`drizzle/0016_account_fields.sql`)

```sql
ALTER TABLE "users" ADD COLUMN "display_name" text;
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamptz;
```

nullable 컬럼만 추가 — 무중단 배포.

### SessionStore.revokeAllByUser 추가

`packages/backend/auth-session` `SessionStore` 인터페이스 + `drizzleSessionStore` 구현:
```typescript
async revokeAllByUser(userId) {
  await db.update(sessions).set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}
```

### AccountUserStore (`apps/api/src/auth/account.stores.ts`)

API 레이어 전용 store. 5개 메서드:
- `findById` — passwordHash + displayName 조회
- `updateDisplayName` — displayName 갱신
- `updatePasswordHash` — 비밀번호 hash 갱신
- `softDelete` — `email → <email>#deleted_<uuid>`, `deleted_at = now()`
- `isSoleOwnerOfAnyOrg` — 다른 멤버가 있는 org의 유일한 owner 여부 확인

## Task 2+3: AccountService + AccountController (TDD Red → Green)

### AccountService.changePassword

```typescript
const user = await userStore.findById(userId);
const valid = await verifyPassword(currentPassword, user.passwordHash);
if (!valid) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다");
await userStore.updatePasswordHash(userId, await hashPassword(newPassword));
```

### AccountService.deleteAccount

```typescript
const isSoleOwner = await userStore.isSoleOwnerOfAnyOrg(userId);
if (isSoleOwner) throw new BadRequestException("ACCOUNT_DELETE_BLOCKED: ...");
const maskedEmail = `${email}#deleted_${randomUUID()}`;
await userStore.softDelete(userId, maskedEmail);
await sessionStore.revokeAllByUser(userId);
```

### GET /auth/me 확장

`AuthController.me()`에 DB 조회 추가 — JWT claim에 없는 `displayName` 포함:
```typescript
async me(@CurrentUser() u: AuthenticatedUser) {
  const row = await accountUserStore.findById(u.sub);
  return { user: { ...u, displayName: row?.displayName ?? null } };
}
```

## 검증 결과

### e2e 테스트 (5종 PASS)

```
✓ PATCH /auth/account/password — 현재 비밀번호 틀림 → 400
✓ PATCH /auth/account/password — 성공 → 200 + 새 비밀번호로 로그인 가능
✓ PATCH /auth/account/profile — displayName 변경 → GET /auth/me 반영
✓ DELETE /auth/account — sole owner (다른 멤버 있는 org) → 400 ACCOUNT_DELETE_BLOCKED
✓ DELETE /auth/account — 단독 org → 200 + refresh 세션 401 확인
```

### 전체 테스트

```
Tests: 168 passed (168)
```

### 타입체크

```
Tasks: 47 successful (all packages)
```

## 주요 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 차단 기준 | sole owner + 다른 멤버 있는 org | 혼자만 있는 개인 org는 이슈 없음 |
| 탈퇴 후 이메일 | `<email>#deleted_<uuid>` 마스킹 | unique 제약 유지 + 재가입 허용 |
| 비밀번호 변경 후 세션 | 유지 | UX 우선 (세션 관리 UI는 spec-19-03) |
