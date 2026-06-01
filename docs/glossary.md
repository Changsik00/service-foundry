---
type: index
aliases: [용어집, glossary, 약어 사전]
tags: [service-foundry, index, meta]
---

# Glossary — 용어 / 약어 사전

> 약어와 도메인 용어를 한 곳에. 각 항목은 권위 노트로 링크한다. 상위: [[index]]

## A–Z

| 용어 | 뜻 | 권위 노트 |
|---|---|---|
| ADR | Architecture Decision Record — 아키텍처 결정 기록 | [[index]] §Decisions |
| AppError | 표준 에러 데이터 모델 (flat code + toJSON/fromJSON) | [[reference/packages/shared-errors]] · [[adr/0009-app-error-design\|ADR-0009]] |
| argon2id | OWASP 권장 패스워드 해싱 알고리즘 | [[explainers/auth/password-hash-argon2id]] |
| AsyncLocalStorage | 요청 단위 컨텍스트(request-id) 전파 메커니즘 | [[explainers/backend/request-id-propagation]] |
| CoreAuthSDK | 프론트 auth provider 공통 5-메서드 계약 | [[explainers/frontend/auth-sdk-provider-adapters]] · [[adr/0017-auth-provider-sdk-prop-contract\|ADR-0017]] |
| CSRF | Cross-Site Request Forgery (token + SameSite 방어) | [[explainers/auth/auth-rate-limit-lockout]] · [[explainers/auth/cookie-strategy]] |
| EdDSA | Ed25519 서명 JWT 알고리즘 | [[explainers/auth/jwt-verify-edDSA]] · [[adr/0013-session-lifecycle\|ADR-0013]] |
| Idempotency-Key | 동일 요청 재실행 방지 키 (결과 replay) | [[explainers/backend/idempotency-key-replay]] |
| JWKS | JSON Web Key Set — 공개키 배포 endpoint | [[explainers/auth/jwt-verify-edDSA]] |
| JWT | JSON Web Token (access token) | [[explainers/auth/jwt-verify-edDSA]] |
| MFA | Multi-Factor Authentication (TOTP/passkey) | [[explainers/auth/mfa-totp-challenge]] |
| MOC | Map of Content — 카탈로그 허브 노트 | [[index]] |
| OAuth | 위임 인가 프로토콜 (PKCE + State) | [[explainers/auth/oauth-pkce-flow]] |
| OTel | OpenTelemetry — 분산 트레이싱/메트릭 | [[explainers/backend/otel-tracing-init-order]] |
| Outbox | Transactional Outbox 패턴 (at-least-once) | [[explainers/backend/transactional-outbox]] |
| PKCE | Proof Key for Code Exchange (OAuth CSRF 방어) | [[explainers/auth/oauth-pkce-flow]] |
| Port/Adapter | 인터페이스(포트) + 교체 가능 구현(어댑터) | [[explainers/backend/notification-port-adapter]] |
| Result | `{ok:true,value}\|{ok:false,error}` 흐름제어 타입 | [[reference/packages/shared-utils]] · [[adr/0008-result-type\|ADR-0008]] |
| Rotation Chain | refresh 토큰 family 기반 회전 + 재사용 감지 | [[explainers/auth/session-rotation-chain]] |
| TOTP | Time-based One-Time Password | [[explainers/auth/mfa-totp-challenge]] |
| WebAuthn | Passkey 공개키 인증 표준 | [[explainers/auth/passkey-webauthn]] |
| tsup | backend 패키지 ESM 번들러 | [[explainers/platform/monorepo-build-turbo-tsup]] |
| turbo | 모노레포 태스크 그래프/캐시 오케스트레이터 | [[explainers/platform/monorepo-build-turbo-tsup]] |
