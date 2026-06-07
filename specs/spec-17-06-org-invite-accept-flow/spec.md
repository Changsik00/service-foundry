# spec-17-06: 초대 endpoint + 수락 흐름

## 개요

Org owner/admin 이 이메일로 초대장을 발송하고, 수신자가 토큰으로 수락하여 멤버십이 생성되는 흐름을 구현한다.

## 배경

- `invitations` 테이블은 spec-17-02 에서 이미 생성됨 (`apps/api/src/infra/schema/invitations.ts`)
- `buildInvitationEmail` 은 `@repo/backend-notification` 에 이미 구현됨
- `NOTIFIER` 는 `notifierProvider` 로 DI 가능 (Resend or dev/noop fallback)
- `generateRefreshToken` / `hashToken` 패턴은 password-reset / email-verify 와 동일

## 기능 요구사항

### POST /auth/org/invite

- **권한**: AuthGuard + orgId from JWT claims (inviter 의 active org)
- **입력**: `{ email: string; role: "admin" | "member" }`
- **처리**:
  1. inviter 가 해당 org 의 owner or admin 인지 멤버십 검증
  2. 랜덤 토큰 생성 → SHA-256 해시 저장 (`tokenHash`)
  3. `invitations` 행 삽입 (expiresAt = now + 24h)
  4. `buildInvitationEmail` 으로 초대 이메일 발송
- **응답**: `{ status: "ok" }`

### POST /auth/org/invite/accept

- **권한**: AuthGuard (수락자가 이미 로그인된 상태)
- **입력**: `{ token: string }`
- **처리**:
  1. 토큰 해시 → `invitations` 행 조회
  2. 만료 여부 검증 (`expiresAt < now` → 410 Gone)
  3. 이미 수락 여부 검증 (`acceptedAt` → 409 Conflict)
  4. `memberships` 에 `(userId, orgId, role)` 삽입
  5. `invitations.acceptedAt = now` 업데이트
  6. 초대받은 org 로 새 accessToken 발급 (org switch 효과)
- **응답**: `{ accessToken: string }`

## 비기능 요구사항

- 토큰 원문은 DB 에 저장하지 않음 (해시만 저장)
- 만료: 24시간
- 재사용 방지: `acceptedAt` non-null 확인
- 중복 초대: 같은 이메일+org 에 미수락 invitation 이 있어도 재발송 허용 (새 행 삽입)

## 범위 외 (Out of Scope)

- 비인증 사용자(신규 가입)의 초대 수락 흐름 → spec-17-07+ 에서 처리
- 초대 취소/재발송 endpoint
- 초대 목록 조회

## 연관

- 선행: spec-17-02 (invitations schema), spec-17-05 (orgId JWT claims)
- 활용: `@repo/backend-notification.buildInvitationEmail`, `generateRefreshToken`, `hashToken`
- 후속: spec-17-07 (초대 경유 신규가입 흐름)
