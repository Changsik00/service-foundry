# Implementation Plan: spec-19-02

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-02-email-change-api`
- 시작 지점: `phase-19-account-authz`
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **confirm 후 전체 세션 revoke**: 보안 우선으로 revokeAllByUser 호출. 기존 세션이 모두 무효화되어 재로그인 필요 → UX 비용 감수 여부 확인
> - [ ] **provider 사용자 차단**: `providerUid != null` 이면 이메일 변경 거부. OAuth 사용자는 provider 측에서 이메일 관리해야 하므로 400

> [!WARNING]
> - [ ] confirm 시점 새 이메일 재검증 — request 후 confirm 전 사이에 새 이메일이 다른 계정에 등록될 경우 409 반환 (이메일 변경 실패)

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
POST /auth/account/email/change-request  (AuthGuard + CsrfGuard)
  │
  ├── providerUid 체크 → 있으면 400
  ├── 새 이메일 중복 체크 → 있으면 409
  ├── token 생성 (24h TTL) → email_change_tokens INSERT
  └── notifier.sendEmail → 새 이메일로 확인 메일

POST /auth/account/email/change-confirm  (CsrfGuard만)
  │
  ├── token 조회 → 미존재/만료/사용됨 → 200 (enumeration-safe)
  ├── 새 이메일 재검증 → 중복 → 409
  ├── users.email = newEmail
  ├── token markUsed
  └── sessionStore.revokeAllByUser
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **테이블** | `email_change_tokens` 신규 | password_reset_tokens·email_verify_tokens 와 동일 패턴, 독립적으로 TTL/상태 관리 |
| **confirm AuthGuard** | 미적용 | 이메일 링크 클릭 → 프론트 페이지 → API 호출 패턴에서 세션이 없을 수 있음 |
| **세션 처리** | revokeAllByUser | 이메일은 로그인 식별자이므로 변경 시 모든 세션 무효화 (비밀번호 변경과 달리 보안 레벨 높음) |
| **provider 사용자** | `providerUid != null` → 400 | OAuth 이메일은 provider가 권위 소스, 독자 변경 시 재로그인 시 덮어써짐 |
| **Supabase 설정** | 영향 없음 | 우리 토큰 시스템 사용 — Supabase autoconfirm 설정과 무관 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### Task 1: DB 마이그레이션 + 알림 빌더

#### [NEW] `apps/api/drizzle/0017_email_change_tokens.sql`
```sql
CREATE TABLE "email_change_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "new_email" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
```

#### [MODIFY] `apps/api/drizzle/meta/_journal.json`
- `0017_email_change_tokens` 엔트리 추가

#### [NEW] `apps/api/src/infra/schema/email-change-tokens.ts`
- Drizzle pgTable 정의: `emailChangeTokens`
- `EmailChangeTokenRow` / `EmailChangeTokenInsert` 타입 export

#### [MODIFY] `apps/api/src/infra/schema/index.ts`
- `emailChangeTokens`, `EmailChangeTokenRow`, `EmailChangeTokenInsert` export 추가
- `appSchema`에 `emailChangeTokens` 추가

#### [MODIFY] `packages/backend/notification/src/index.ts`
- `buildEmailChangeEmail(token, frontendUrl)` 함수 추가

### Task 2: EmailChangeService + AccountController 확장 (Red→Green)

#### [NEW] `apps/api/src/auth/email-change.stores.ts`
```typescript
export const EMAIL_CHANGE_TOKEN_STORE = Symbol("EMAIL_CHANGE_TOKEN_STORE");
export const InjectEmailChangeTokenStore = () => Inject(EMAIL_CHANGE_TOKEN_STORE);

export interface EmailChangeTokenStore {
  insert(data: EmailChangeTokenInsert): Promise<void>;
  findByHash(tokenHash: string): Promise<EmailChangeTokenRow | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}

export function createEmailChangeTokenStore(db: AnyDb): EmailChangeTokenStore { ... }
```

#### [NEW] `apps/api/src/auth/email-change.service.ts`
```typescript
@Injectable()
export class EmailChangeService {
  async requestEmailChange(userId: string, newEmail: string): Promise<void>
  async confirmEmailChange(token: string): Promise<ConfirmOutcome>
}
```

- `requestEmailChange`:
  - `userStore.findById(userId)` → `providerUid != null` → 400
  - `userStore.findByEmail(newEmail)` → 존재 → 409
  - token 생성 + `tokenStore.insert` + `notifier.sendEmail`

- `confirmEmailChange` (→ ConfirmOutcome):
  - token 조회 → "invalid" / "expired" / "used"
  - 새 이메일 재검증 → 중복이면 409 (enum-safe 아님 — 이미 token 소비됨)
  - `userStore.updateEmail(userId, newEmail)` + `tokenStore.markUsed` + `sessionStore.revokeAllByUser`

#### [MODIFY] `apps/api/src/auth/account.stores.ts` (AccountUserStore 확장)
- `findById` 반환에 `providerUid: string | null` 추가
- `updateEmail(id: string, email: string): Promise<void>` 추가

#### [MODIFY] `apps/api/src/auth/account.controller.ts`
```typescript
@Post("email/change-request")
@UseGuards(AuthGuard, CsrfGuard)
@HttpCode(200)
async requestEmailChange(@Body() body, @CurrentUser() user): Promise<{ status: "ok" }>

@Post("email/change-confirm")
@UseGuards(CsrfGuard)   // AuthGuard 없음 — 메일 링크 클릭 후 세션 없을 수 있음
@HttpCode(200)
async confirmEmailChange(@Body() body): Promise<{ status: "ok" }>
```

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
- `EmailChangeService` providers 등록
- `EMAIL_CHANGE_TOKEN_STORE` factory provider 등록 (`DATABASE` 사용)

#### [NEW] `apps/api/src/auth/email-change.service.test.ts`
단위 테스트 — mock stores 사용:
1. providerUid 있는 사용자 → 400
2. 새 이메일 중복 → 409
3. 정상 요청 → token 저장 + 메일 발송 확인
4. 미존재 token confirm → "invalid"
5. 만료 token → "expired"
6. 이미 사용된 token → "used"
7. 정상 confirm → email 업데이트 + markUsed + revokeAllByUser 호출

#### [NEW] `apps/api/src/auth/email-change.e2e.test.ts`
e2e 5종 (실 DB):
1. provider 사용자 (providerUid 있는 유저) → 400
2. 새 이메일 이미 사용 중 → 409
3. 정상 요청 → 200 + DB에 token 저장 확인
4. 잘못된 token confirm → 200 (enumeration-safe)
5. 정상 confirm → 200 + 새 이메일로 로그인 성공 + 기존 refresh token 401 확인

## 🧪 검증 계획

### 단위 테스트
```bash
pnpm vitest run --reporter=verbose apps/api/src/auth/email-change.service.test.ts
```

### 통합 테스트 (e2e)
```bash
pnpm vitest run --reporter=verbose apps/api/src/auth/email-change.e2e.test.ts
```

### 전체 테스트
```bash
pnpm turbo run test --filter=@apps/api
```

## 🔁 Rollback Plan

- DB 마이그레이션은 `DROP TABLE email_change_tokens` 으로 롤백 가능 (신규 테이블만, 기존 데이터 영향 없음)
- 코드 롤백: `git revert` 또는 spec 브랜치 미머지

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
