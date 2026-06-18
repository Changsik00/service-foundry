# Implementation Plan: spec-19-03

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-03-session-management-api`
- 시작 지점: `phase-19-account-authz`
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **`DELETE /auth/sessions` 동작**: 현재 세션 제외 전체 revoke. refresh_token 쿠키가 없으면 현재 세션 식별 불가 → 쿠키 없을 때 전체 revoke (포함 자신)로 fallback 여부 확인
> - [ ] **SessionStore 패키지 수정**: `packages/backend/auth-session/src/store.ts` 인터페이스에 `listActiveByUser`, `findById`, `revokeOthers` 3개 메서드 추가. 기존 구현체와 테스트 mock 다수 수정 필요

> [!WARNING]
> - [ ] `packages/backend/auth-session/src/store.ts` interface 변경 → 이 interface를 mock하는 모든 테스트 파일에 새 메서드 추가 필요 (passkey, signin, signup, email-change, account 등 ~5개 파일)

## 🎯 핵심 전략

### 흐름

```
GET /auth/sessions  (AuthGuard)
  ├── sessionStore.listActiveByUser(userId)
  ├── 쿠키 refresh_token 해시 → 현재 세션 ID 식별
  └── { sessions: [{ id, createdAt, expiresAt, orgId, current }] }

DELETE /auth/sessions/:id  (AuthGuard + CsrfGuard)
  ├── sessionStore.findById(id)
  ├── session.userId !== currentUser.sub → 403
  └── sessionStore.updateRevoked(id, now)

DELETE /auth/sessions  (AuthGuard + CsrfGuard)
  ├── refresh_token 쿠키 해시 → currentHash
  └── sessionStore.revokeOthers(userId, currentHash)
      (currentHash = null → 전체 revoke)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **현재 세션 식별** | refresh_token 쿠키 해시 | JWT에 sid 없음 — 쿠키 기반이 가장 단순 |
| **SessionStore 위치** | 패키지 인터페이스 확장 | `packages/backend/auth-session` — 도메인 소유 |
| **새 컨트롤러** | 기존 `AuthController`에 추가 | 라우트가 `/auth/sessions` — AuthModule 내 응집 |
| **프론트 UI** | `SessionsCard` 컴포넌트 + 대시보드 추가 | spec-19-07 설정 화면 전 interim — 즉시 가시성 |
| **sessionQueries** | `features/account/queries.ts` 확장 | 기존 account 쿼리 파일과 동일 도메인 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### Backend

#### [MODIFY] `packages/backend/auth-session/src/store.ts`
인터페이스에 3개 메서드 추가:
```typescript
listActiveByUser(userId: string): Promise<SessionRow[]>;
findById(id: string): Promise<SessionRow | null>;
revokeOthers(userId: string, excludeHash: string | null): Promise<void>;
```

#### [MODIFY] `packages/backend/auth-session/src/drizzle-store.ts`
3개 메서드 구현:
- `listActiveByUser`: `WHERE userId = ? AND revokedAt IS NULL AND expiresAt > now()`
- `findById`: id로 단건 조회
- `revokeOthers`: `WHERE userId = ? AND refreshTokenHash != ? AND revokedAt IS NULL`

#### [MODIFY] `packages/backend/auth-session/src/session.test.ts`
fake store에 3개 메서드 추가 (in-memory 구현)

#### [MODIFY] 기존 테스트 mock 파일 5곳 (vi.fn() 추가)
`passkey.service.test.ts`, `signin.service.test.ts`, `signup.service.test.ts`,
`email-change.service.test.ts`, `account.service` 관련 테스트

#### [NEW] `apps/api/src/auth/session-management.service.ts`
```typescript
@Injectable()
export class SessionManagementService {
  async listSessions(userId, currentRefreshToken?): Promise<SessionInfo[]>
  async revokeSession(userId, sessionId): Promise<void>  // 403 if not owner
  async revokeOtherSessions(userId, currentRefreshToken?): Promise<void>
}
```

SessionInfo = `{ id, createdAt, expiresAt, orgId, current: boolean }`

#### [MODIFY] `apps/api/src/auth/auth.controller.ts`
`GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions` 추가

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
`SessionManagementService` provider 등록

#### [NEW] `apps/api/src/auth/session-management.service.test.ts`
단위 테스트 (mock SessionStore)

#### [NEW] `apps/api/src/auth/session-management.e2e.test.ts`
e2e 4종:
1. `GET /auth/sessions` → 목록 반환 + current 표시
2. `DELETE /auth/sessions/:id` → 해당 세션 revoke, refresh 401
3. `DELETE /auth/sessions/:id` 타인 세션 → 403
4. `DELETE /auth/sessions` → 현재 제외 나머지 revoke

### Frontend

#### [MODIFY] `apps/web/src/features/account/queries.ts`
`sessionQueries.list()` 추가

#### [NEW] `apps/web/src/features/account/SessionsCard.tsx`
```typescript
"use client"
// useQuery(sessionQueries.list()) → 세션 목록 렌더
// 현재 세션 = current badge
// 각 세션 행: createdAt, expiresAt, orgId, "종료" 버튼
// "다른 모든 세션 종료" 버튼 (mutation)
```

#### [MODIFY] `apps/web/src/features/account/index.ts`
`SessionsCard` export 추가

#### [MODIFY] `apps/web/src/app/(console)/page.tsx`
`SessionsCard` 추가 (grid에 3번째 카드)

## 🧪 검증 계획

### e2e
```bash
pnpm --filter=@apps/api exec vitest run src/auth/session-management.e2e.test.ts
```

### 전체
```bash
pnpm --filter=@apps/api exec vitest run
pnpm turbo run typecheck
```

## 🔁 Rollback Plan

- 코드 전용 변경 (신규 테이블 없음) — `git revert` 또는 spec 미머지

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
