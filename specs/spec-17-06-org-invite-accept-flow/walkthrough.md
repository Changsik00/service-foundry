# Walkthrough: spec-17-06

## 변경 요약

Org owner/admin이 이메일로 초대장을 발송하고, 수신자가 토큰으로 수락하여 org 멤버십이 생성되는 흐름을 구현했다.

## 주요 결정 사항

### 1. 토큰 해시 저장 패턴

password-reset / email-verify 와 동일하게 `generateRefreshToken()` + `hashToken()` 패턴을 사용했다. DB에는 `tokenHash`만 저장하고, 원문 token은 이메일로만 전달된다. 이미 검증된 패턴이므로 별도 인프라 없이 재활용.

### 2. accept() — 인증된 사용자만 수락 가능

spec 범위는 "이미 계정이 있는 사용자의 수락"으로 한정했다. `@UseGuards(AuthGuard)` 적용으로 JWT 필수. 신규 가입 경유 수락(invitation token을 signup flow에 연결)은 spec-17-07에서 처리.

### 3. accept() 반환값 — 새 accessToken

수락 즉시 초대받은 org의 accessToken을 발급해 org switch 효과를 준다. 별도 `POST /auth/org/switch` 호출 없이 바로 새 org 컨텍스트로 진입 가능.

### 4. 만료/중복 수락 구분

- `expiresAt < now` → 410 Gone
- `acceptedAt !== null` → 409 Conflict

두 경우를 구분해 클라이언트가 적절한 안내 메시지를 표시할 수 있게 했다.

### 5. 권한 검증 — memberships 직접 조회

별도 guard 없이 `OrgInviteService.invite()` 내부에서 `memberships` 테이블을 직접 조회해 role을 확인한다. `["owner", "admin"].includes(membership.role)` 검증으로 member는 초대 불가.

## 파일 변경 내역

| 파일 | 변경 |
|---|---|
| `packages/shared/auth-contracts/src/index.ts` | MODIFY — `OrgInviteInput`, `OrgInviteAcceptInput` 추가 |
| `apps/api/src/auth/org-invite.service.ts` | NEW — `OrgInviteService` (invite + accept) |
| `apps/api/src/auth/org-invite.service.test.ts` | NEW — 단위 테스트 6개 |
| `apps/api/src/auth/auth.controller.ts` | MODIFY — `POST /auth/org/invite`, `POST /auth/org/invite/accept` 추가 |
| `apps/api/src/auth/auth.controller.test.ts` | MODIFY — `OrgInviteService` mock 추가 |
| `apps/api/src/auth/auth.module.ts` | MODIFY — `OrgInviteService` provider 등록 |

## 검증

- 단위 테스트 6개 PASS (invite:2, accept:4)
- typecheck PASS (전체 모노레포)
- lint PASS (biome)
