# PR: spec-17-06 — 초대 endpoint + 수락 흐름

## Summary

- `POST /auth/org/invite { email, role }` — org owner/admin이 이메일로 초대장 발송 (멤버십 권한 검증 + 24시간 만료 토큰)
- `POST /auth/org/invite/accept { token }` — 인증된 사용자가 초대 토큰으로 수락 → memberships 생성 + 새 accessToken 발급
- `OrgInviteInput` / `OrgInviteAcceptInput` contracts 추가 (`@repo/auth-contracts`)

## Test plan

- [x] `org-invite.service.test.ts` — invite: owner 성공 / member 실패(ForbiddenException)
- [x] `org-invite.service.test.ts` — accept: 유효 토큰, 없음(404), 만료(410), 중복(409)
- [x] `auth.controller.test.ts` — OrgInviteService mock 추가로 기존 테스트 회귀 없음
- [x] typecheck PASS (전체 모노레포)
- [x] lint PASS (biome)

## 참고

- 기반 브랜치: `phase-17`
- 선행 spec: spec-17-05 (orgId JWT claims), spec-17-02 (invitations schema)
- 후속 spec: spec-17-07 (초대 경유 신규 가입 흐름)
- 토큰 해시: `generateRefreshToken` + `hashToken` (`@repo/backend-auth-session`) — password-reset 과 동일 패턴

🤖 Generated with [Claude Code](https://claude.com/claude-code)
