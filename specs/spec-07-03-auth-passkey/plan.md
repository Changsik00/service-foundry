# plan: spec-07-03-auth-passkey

## 핵심 결정

1. **챌린지 저장**: JWT 쿠키 대신 DB 테이블(`passkey_challenges`) — TTL 5분, UUID PK를 challengeToken으로 사용
2. **공개키 저장**: `bytea` 대신 `text (base64url)` — Drizzle 호환성 + 직렬화 단순화
3. **E2E 검증 범위**: 브라우저 crypto API 없이 실 credential 생성 불가 → `verifyRegister`/`verifyAuth` 경로는 단위 테스트(vi.mock)로 커버
4. **rpID 파생**: `jwtOpts.issuer` 에서 protocol/port 제거 — 별도 설정 주입 불필요

## 구현 단계

1. DB 스키마 + 마이그레이션
2. `@repo/backend-auth-passkey` 패키지
3. `PasskeyStore` + `PasskeyService`
4. `PasskeyController` + `AuthModule` 등록 + E2E 테스트
5. Ship
