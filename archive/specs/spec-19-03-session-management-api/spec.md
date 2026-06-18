# spec-19-03: 세션 관리 API + UI

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-03` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-03-session-management-api` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-12 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

세션 토큰은 DB에 저장되고 rotation/revoke 로직이 완성돼 있다. 그러나 사용자가 자신의 활성 세션 목록을 조회하거나 개별·일괄 종료할 수 있는 API와 UI가 없다.

### 문제점

- 분실 기기나 의심스러운 세션을 수동으로 종료할 방법이 없음
- 계정 설정 UI(spec-19-07)에서 "활성 세션" 섹션을 구현할 수 없음

### 해결 방안 (요약)

`GET /auth/sessions`·`DELETE /auth/sessions/:id`·`DELETE /auth/sessions` 3개 엔드포인트 추가 + `SessionsCard` 프론트 컴포넌트. 현재 세션은 refresh_token 쿠키로 식별해 `current: true` 마킹 및 일괄 종료 시 보존.

## 🎯 요구사항

### Functional Requirements

1. `GET /auth/sessions` (AuthGuard) — 현재 사용자의 활성 세션 목록 반환
   - 응답: `{ sessions: [{ id, createdAt, expiresAt, orgId, current }] }`
   - `current: boolean` — refresh_token 쿠키 해시 기반 식별
2. `DELETE /auth/sessions/:id` (AuthGuard + CsrfGuard) — 특정 세션 revoke
   - 타인 세션 접근 → 403 ForbiddenException
3. `DELETE /auth/sessions` (AuthGuard + CsrfGuard) — 현재 세션 제외 전체 revoke
   - refresh_token 쿠키로 현재 세션 식별, 나머지 revokedAt 설정
4. `SessionsCard` 프론트 컴포넌트 + 대시보드 노출
   - 세션 목록 렌더링, 개별 "종료" 버튼, "다른 모든 세션 종료" 버튼
   - 현재 세션 배지 표시 (종료 불가)

### Non-Functional Requirements

1. `SessionStore` 확장은 backward compatible (기존 메서드 유지)
2. `refreshTokenHash`는 응답에 절대 포함 불가

## 🚫 Out of Scope

- IP/User-Agent 저장·표시 (sessions 테이블 미보유 컬럼 — 별도 spec)
- 위치 정보, suspicious login 감지

## 📑 ADR 후보

- [ ] 없음

## 🔗 관련 문서

- 관련 spec: [[spec-19-01]] (revokeAllByUser), [[spec-19-02]] (refreshToken 쿠키 활용)
- 관련 패키지: `packages/backend/auth-session/src/`

## ✅ Definition of Done

- [ ] e2e 4종 PASS + typecheck PASS
- [ ] `SessionsCard` 대시보드 노출 동작
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-19-03-session-management-api` 브랜치 push + PR 생성
