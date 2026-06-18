# Walkthrough: spec-19-03 세션 관리 API + UI

## 구현 요약

| 커밋 | 내용 |
|---|---|
| `feat(spec-19-03): SessionManagementService + 세션 API e2e 4종 Green` | 백엔드 전체 |
| `feat(spec-19-03): SessionsCard 컴포넌트 + 대시보드 노출` | 프론트엔드 전체 |

---

## Task 1: 백엔드

### SessionStore 패키지 확장 (`packages/backend/auth-session`)

`SessionStore` 인터페이스에 3개 메서드 추가:

- `findById(id)` — 세션 단건 조회 (403 소유권 체크용)
- `listActiveByUser(userId)` — `revokedAt IS NULL AND expiresAt > now()` 활성 세션 목록
- `revokeOthers(userId, excludeHash)` — 특정 해시 제외 일괄 revoke (현재 세션 보존)

`drizzle-store.ts`에 3개 구현, `session.test.ts` fake store 업데이트.

### 기존 테스트 mock 업데이트

`passkey`, `signin`, `signup`, `email-change` 4개 서비스 테스트에 `findById`, `listActiveByUser`, `revokeOthers` `vi.fn()` 추가.

### SessionManagementService (`apps/api/src/auth/session-management.service.ts`)

```
listSessions(userId, currentRefreshToken?)
  → listActiveByUser → current 플래그(refreshTokenHash 일치 여부) 설정
  → SessionInfo[] (refreshTokenHash 미포함)

revokeSession(userId, sessionId)
  → findById → userId 불일치/미존재 → 403 ForbiddenException
  → updateRevoked(id, now)

revokeOtherSessions(userId, currentRefreshToken?)
  → hashToken(currentRefreshToken) → revokeOthers(userId, hash | null)
```

### API 엔드포인트 (`auth.controller.ts`)

| 메서드 | 경로 | 가드 | 설명 |
|---|---|---|---|
| GET | `/auth/sessions` | AuthGuard | 활성 세션 목록 + current 식별 |
| DELETE | `/auth/sessions/:id` | AuthGuard + CsrfGuard | 단건 revoke |
| DELETE | `/auth/sessions` | AuthGuard + CsrfGuard | 현재 세션 외 전체 revoke |

**현재 세션 식별**: JWT에 sid 없으므로 `refresh_token` 쿠키를 `hashToken()`으로 해시해 `refreshTokenHash` 비교.

### e2e 4종 (모두 PASS)

1. `GET /auth/sessions` → 목록 반환 + `current: true` 표시
2. `DELETE /auth/sessions/:id` → revoke 후 해당 refresh_token으로 갱신 시 401
3. `DELETE /auth/sessions/:id` 타인 세션 → 403
4. `DELETE /auth/sessions` → 현재 세션 제외 revoke, 기존 session refresh 401

---

## Task 2: 프론트엔드

### queries.ts 확장

- `sessionQueries.list()` — `GET /auth/sessions` TanStack Query 쿼리
- `useRevokeSession()` — `DELETE /auth/sessions/:id` mutation, 성공 시 목록 invalidate
- `useRevokeOtherSessions()` — `DELETE /auth/sessions` mutation

### SessionsCard 컴포넌트

```
SessionsCard
  ├── CardHeader: "활성 세션" + (다른 세션 있으면) "다른 세션 모두 종료" 버튼
  └── CardContent (divide-y)
        ├── Loading → Skeleton 행 2개
        ├── Error → 오류 메시지
        ├── Empty → "활성 세션이 없습니다"
        └── 세션 행 × N
              ├── current 세션: brand 배지 + "종료" 버튼 없음
              └── 일반 세션: "종료" (ghost/destructive) 버튼
```

### 대시보드 노출

`page.tsx` grid에 `<SessionsCard />` 추가 — `AccountCard`와 나란히 2열 레이아웃.

---

## 검증

```bash
# 전체 API 테스트
pnpm --filter=@apps/api exec vitest run   # 191 passed

# typecheck
pnpm turbo run typecheck   # 47 tasks passed
```
