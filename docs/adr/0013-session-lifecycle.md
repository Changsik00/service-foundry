---
id: ADR-0013
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0013: Session Lifecycle — JWT EdDSA + Refresh Rotation + Reuse Detection

## 📚 Context

ADR-0006에서 Auth Platform 자체 구축 + "Auth Engine은 외부 라이브러리" 원칙을 박았다. 본 ADR은 *Session lifecycle 세부 결정*을 박는다.

2차안(`docs/notes/auth-foundation-architecture.md` §Session 전략 + §JWT 구체 결정사항)이 제시한 패턴:

- Access Token = JWT (short TTL, stateless)
- Refresh Token = opaque random (DB hashed, rotation, reuse detection)
- **Refresh Rotation + Reuse Detection (RFC 6819)**: 탈취 자동 대응
- JWT algorithm = EdDSA (RS256/ES256 대비 빠르고 키 짧음)
- Key Rotation 90일 + JWKS endpoint

이는 *RFC 6819 권고*이며 *프로덕션 표준*. 본 ADR이 *컨벤션으로 박음*.

## 🎯 Decision

다음 7 결정을 박는다.

### Decision 1: Access Token = JWT, 5~15분 TTL

- 라이브러리: **jose** (`panva/jose`) — Node + Edge runtime 호환.
- TTL: **5~15분** (환경별 조정 가능). 짧을수록 revocation 신뢰성 ↑, 길수록 refresh 부담 ↓.
- Stateless — DB 조회 없이 검증.

### Decision 2: JWT Algorithm = EdDSA (Ed25519)

| 알고리즘 | 채택 여부 | 이유 |
|---|---|---|
| HS256 | ❌ | key 공유 = compromise 시 치명적. *대칭키*라 분산 verifier 불가. |
| RS256 | △ | 안정. 키 크기 크고 검증 느림. |
| ES256 | △ | 키 짧음. 안정. |
| **EdDSA (Ed25519)** | ✅ | 빠르고 키 짧고 안전. 2026 표준 방향. |

### Decision 3: JWT Claims

- **필수**: `sub` (userId) / `iat` / `exp` / `iss` / `aud`
- **권장**: `jti` (token ID — revocation 용 deny list 키)
- **금지**: PII (이름, 전화번호, 주소) — token 크기 + 노출 위험
- **조건부**: `roles` / `permissions` — token 크기 관리 (작은 RBAC만 포함, 큰 권한은 BE에서 조회)

### Decision 4: Refresh Token = opaque random, DB hashed

- 형식: **cryptographically random 32+ bytes**. JWT *아님*.
- 저장: DB에 **hashed** (SHA-256). 평문 저장 금지.
- TTL: **14~30일**.
- Rotation: refresh 사용 시 *즉시 invalidate* + 새 refresh 발급.

### Decision 5: Rotation Chain + Reuse Detection (RFC 6819) **필수**

- 각 refresh token은 `refreshTokenFamily` (chain root ID)를 가짐.
- **정상 흐름**:
  ```
  refresh 요청 → 기존 refresh invalidate → 새 refresh 발급 (같은 family)
  ```
- **탈취 감지** (이미 invalidate된 refresh가 재진입):
  ```
  → 해당 user의 family 전체 session revoke
  → SUSPICIOUS_ACTIVITY 이벤트 발행 + alert
  → user에게 알림 이메일 ("내가 안 했음" 링크 포함)
  ```
- 이거 없으면 rotation 의미 절반 사라짐 (탈취된 token도 valid한 동안 사용 가능).

### Decision 6: Session Model (Drizzle schema)

```ts
Session {
  id: UUID                      // PK
  userId: UUID                  // FK -> users
  refreshTokenHash: string      // SHA-256, 평문 저장 ❌
  refreshTokenFamily: UUID      // rotation chain root
  device: string                // user-agent parsed
  ip: string                    // IP address
  userAgent: string             // raw UA
  geo: string | null            // GeoIP 결과 (impossible travel 감지)
  createdAt: Date
  lastUsedAt: Date              // 갱신: refresh 사용 시
  expiresAt: Date
  revokedAt: Date | null
  revokedReason: string | null  // "reuse_detected" / "user_logout" / "admin_force" / "expired"
}
```

운영 가치:
- 모든 기기 로그아웃 (`DELETE WHERE userId = ?`)
- 특정 세션 종료 (`UPDATE SET revokedAt WHERE id = ?`)
- 보안 감사 (`SELECT WHERE userId = ? AND revokedReason IS NOT NULL`)
- 탈취 자동 대응 (Decision 5)

### Decision 7: Key Rotation 90일 + JWKS Endpoint

- Signing key는 **90일마다 rotation**.
- 이전 키는 *grace period* 동안 verify-only로 유지 (token TTL + 일정 기간).
- `/.well-known/jwks.json` endpoint 노출 — 다른 서비스가 *JWKS로 검증*.
- Access token revocation:
  - **Option A** (기본): Short TTL (5~15분)만으로 운영 — revocation list 없음. *대부분의 경우 충분*.
  - **Option B** (옵션): `jti` deny list (Redis, TTL = token TTL) — 즉시 무효화 필요한 경우만. phase-09 admin tool에서 사용 시점에 박음.

### Decision 8: `@repo/auth-session` 별 패키지

- `auth-jwt`(JWT 발급/검증)와 *별 책임*:
  - `auth-session` = rotation chain + reuse detection + Session model + DB orchestration
  - `auth-jwt` = pure JWT (jose wrapper) + JWKS endpoint
- 응집도: Session 생명주기는 *jwt와 독립*. Drizzle schema가 *session에 특화*.

## ✅ Consequences

### 긍정
- **프로덕션 표준**: RFC 6819 + 2026 best practice.
- **탈취 자동 대응**: reuse detection 1건이 *대규모 incident 회피*.
- **운영 가능성**: Session model로 admin tool 박을 수 있음 (phase-09).
- **stateless access + stateful refresh**: 검증 빠름 + revocation 정확.
- **JWKS 분산 검증**: 마이크로서비스 확장 시 검증 자연.

### 부정 / Trade-off
- **DB write 부담**: refresh 사용마다 SELECT + INSERT (rotation). PostgreSQL은 충분 — Redis도 *과잉*.
- **Key rotation 운영**: 90일마다 *수동 또는 자동 rotation script* 필요. phase-10 (Ops) tooling 후보.
- **Geo lookup 의존성**: `geo` 필드는 GeoIP DB 필요. MaxMind 또는 free DB 채택 결정 phase-10.

## 🔄 Alternatives

| 대안 | 비채택 이유 |
|---|---|
| **HS256 (symmetric)** | key 공유 = compromise 시 치명적. 분산 verifier 불가. |
| **Access token only (refresh 없음)** | TTL 짧으면 UX 나쁨, 길면 revocation 어려움. 표준 패턴 비채택. |
| **Single signing key (rotation 없음)** | 키 유출 시 대규모 incident. 90일 rotation이 표준. |
| **Reuse detection 안 함** | rotation 의미 절반 사라짐 — 탈취된 token이 *valid 한 동안* 사용 가능. RFC 6819 권고 위반. |
| **Refresh = JWT** (opaque random 대신) | JWT는 *self-contained*라 invalidate 어려움. DB 추적이 표준. |
| **`auth-jwt`에 session 통합** | rotation/revocation 로직이 *jwt 발급과 강결합* — 책임 분리 약화. `auth-session` 별 패키지로 응집. |

## 🔗 Related

- **선행**:
  - [ADR-0006](./0006-auth-strategy.md) — Auth Platform 전략 (본 ADR은 §A.3 cross-ref)
  - [ADR-0005](./0005-backend-framework-and-orm-strategy.md) — Drizzle (Session schema)
- **후속**:
  - [ADR-0014](./0014-auth-security-baseline.md) — Cookie 전략 (refresh token cookie 저장)
  - phase-05 (Auth Core) — `@repo/auth-session` / `@repo/auth-jwt` 패키지 박음
  - phase-09 (Admin Tools) — Session 강제 종료 UI
  - phase-10 (Ops) — Key rotation script + jti deny list (옵션)
- **라이브러리**:
  - [jose](https://github.com/panva/jose) (JWT)
  - PostgreSQL (Session storage)
- **외부 표준**:
  - RFC 6819 — OAuth 2.0 Threat Model and Security Considerations (Reuse Detection 권고)
- **design note**: [`docs/notes/auth-foundation-architecture.md`](../notes/auth-foundation-architecture.md) §Session 전략 / §JWT 구체 결정사항
