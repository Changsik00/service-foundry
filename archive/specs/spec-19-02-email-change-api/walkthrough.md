# Walkthrough: spec-19-02

## 커밋 이력

```
439a69a feat(spec-19-02): email_change_tokens 마이그레이션 + buildEmailChangeEmail
0e5919c feat(spec-19-02): EmailChangeService + AccountController e2e 5종 Green
```

## Task 1: DB 마이그레이션 + 알림 빌더

### 마이그레이션 (`drizzle/0017_email_change_tokens.sql`)

```sql
CREATE TABLE "email_change_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "new_email" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "email_change_tokens_token_hash_unique" UNIQUE("token_hash")
);
```

password_reset_tokens / email_verify_tokens와 동일 패턴. 새 이메일 주소(`new_email`)를 토큰 레코드에 함께 저장.

### buildEmailChangeEmail (`packages/backend/notification`)

```typescript
export function buildEmailChangeEmail(token: string, frontendUrl: string): EmailMessage {
  const link = `${frontendUrl}/auth/email-change/confirm?token=${token}`;
  return { to: "", subject: "이메일 주소 변경 확인", body: `... ${link} ...` };
}
```

### AccountUserStore 확장

기존 `AccountUserStore`에 `providerUid` 반환 + `findByEmail` + `updateEmail` 추가.

## Task 2: EmailChangeService + Controller (TDD Green)

### 흐름

```
POST /auth/account/email/change-request  (AuthGuard + CsrfGuard)
  ├── providerUid != null → 400
  ├── 새 이메일 중복 → 409
  └── token(24h) → email_change_tokens INSERT → 새 이메일로 메일 발송

POST /auth/account/email/change-confirm  (CsrfGuard만)
  ├── token 미존재 → "invalid" (200, enumeration-safe)
  ├── 만료 → "expired" (200)
  ├── 사용됨 → "used" (200)
  ├── confirm 시점 새 이메일 재검증 → 중복 → 409
  ├── users.email = newEmail + token markUsed
  └── sessionStore.revokeAllByUser → 재로그인 강제
```

### 주요 결정 사항

- **confirm에 AuthGuard 없음**: 이메일 링크 클릭 후 세션 없는 경우 대응
- **confirm 후 전체 세션 revoke**: 이메일은 로그인 식별자 — 변경 시 모든 세션 무효화
- **Supabase 설정 무관**: 우리 토큰 시스템 사용 — autoconfirm 설정과 무관

### e2e 테스트 토큰 취득 방법

실제 이메일을 받을 수 없으므로, `change-request` 후 DB에서 해당 레코드를 찾아 `token_hash`를 알려진 SHA-256 해시값으로 교체 후 원본 토큰으로 confirm 호출.

## 검증 결과

### 단위 테스트 (7종 PASS)

```
✓ providerUid 있는 사용자 → BadRequestException
✓ 새 이메일 이미 사용 중 → ConflictException
✓ 정상 요청 → token DB 저장 + 새 이메일로 발송
✓ 미존재 token confirm → 'invalid'
✓ 만료된 token → 'expired'
✓ 이미 사용된 token → 'used'
✓ 정상 confirm → email 갱신 + markUsed + revokeAllByUser
```

### e2e 테스트 (5종 PASS)

```
✓ provider 사용자 (providerUid 있음) → 400
✓ 새 이메일 이미 사용 중 → 409
✓ 정상 요청 → 200 + email_change_tokens 레코드 저장
✓ 잘못된 token confirm → 200 (enumeration-safe)
✓ 정상 confirm → 200 + 새 이메일로 로그인 + 기존 세션 revoke
```

### 전체 테스트

```
Tests: 180 passed (180)
```

### 타입체크

```
Tasks: 47 successful (all packages)
```
