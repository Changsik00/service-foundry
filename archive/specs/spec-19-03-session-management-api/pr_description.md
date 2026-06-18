# spec-19-03: 세션 관리 API + UI

## 변경 사항

### 백엔드

**`packages/backend/auth-session`**
- `SessionStore` 인터페이스에 `findById` / `listActiveByUser` / `revokeOthers` 추가
- `drizzleSessionStore` 3개 메서드 구현 (`gt`, `ne` drizzle 조건 활용)
- fake store (`session.test.ts`) 및 기존 mock 4종 업데이트

**`apps/api/src/auth/`**
- `session-management.service.ts` 신규 — 세션 목록·단건 revoke·일괄 revoke 서비스
- `auth.controller.ts` — `GET/DELETE /auth/sessions`, `DELETE /auth/sessions/:id` 추가
- `auth.module.ts` — `SessionManagementService` provider 등록
- e2e 4종 추가: 목록+current / 단건revoke+401 / 403 / 일괄revoke

### 프론트엔드

**`apps/web/src/features/account/`**
- `queries.ts` — `sessionQueries.list()`, `useRevokeSession`, `useRevokeOtherSessions` 추가
- `SessionsCard.tsx` 신규 — 활성 세션 목록, current 배지, 개별·일괄 종료
- `index.ts` — `SessionsCard`, `sessionQueries` export
- `page.tsx` — 대시보드에 `SessionsCard` 추가

## 테스트

- 전체 API 테스트 191개 PASS
- typecheck 47 tasks PASS
- e2e 4종: 목록+current / revoke+401 / 403 / 일괄revoke

## 주요 결정

| 결정 | 이유 |
|---|---|
| 현재 세션 식별 = `refresh_token` 쿠키 해시 | JWT에 sid 없음 — 쿠키 기반이 단순 |
| `revokeOthers(excludeHash=null)` → 전체 revoke | 쿠키 없는 요청 fallback |
| `refreshTokenHash` 응답 미포함 | 보안 원칙 — 내부 해시 노출 금지 |
