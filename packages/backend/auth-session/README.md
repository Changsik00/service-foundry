# @repo/backend-auth-session

Pure backend session management — Drizzle Session schema + rotation chain + reuse detection (ADR-0013/0014).

## 부트 가이드 (수동 검증)

```bash
# 1. 로컬 PostgreSQL (Docker)
docker run -d --name auth-pg \
  -e POSTGRES_PASSWORD=local \
  -e POSTGRES_DB=service_foundry_dev \
  -p 5432:5432 \
  postgres:16

# 2. migration 실행
DATABASE_URL=postgres://postgres:local@localhost:5432/service_foundry_dev \
  pnpm --filter @repo/backend-auth-session db:migrate

# 3. schema 확인
psql postgres://postgres:local@localhost:5432/service_foundry_dev -c "\d sessions"
```

## API

```ts
import { createSession, rotateSession, revokeSession } from "@repo/backend-auth-session";

// 1. signin → session 생성
const { session, refreshToken } = await createSession(store, { userId });
// → client 에 refreshToken 전달 (cookie 등)

// 2. token rotation — 4 분기
const result = await rotateSession(store, presentedToken);
match(result)
  .with({ type: "rotated" }, ({ refreshToken }) => /* 새 token */)
  .with({ type: "reuse_detected" }, () => /* family 전체 revoke + alert */)
  .with({ type: "expired" }, () => /* 만료 — 재인증 유도 */)
  .with({ type: "not_found" }, () => /* invalid token */)
  .exhaustive();

// 3. 명시 revoke
await revokeSession(store, sessionId);
```

## Rotation 정공법 (미래 검토 — *지금은 minimal*)

본 minimal 구현은 *refresh token rotation 의 최소 표준* 만 박았음. *full 정공법* (OWASP ASVS / OAuth2 RFC 6819 가이드) 는 다음을 박음. **본 절은 기억 위치** — 후속 spec / phase 에서 박을 항목.

### 본 spec 에 *박힘* (minimal)

| 항목 | 동작 |
|---|---|
| Unknown token | `not_found` |
| **Revoked token 재제시** (reuse) | family 전체 revoke + `reuse_detected` |
| **`expiresAt < now`** (만료) | `expired` (revoke 박지 않음, 거부만) |
| **Family UUID 격리** | 디바이스 별 자연 격리 — 한 디바이스 token 유출이 다른 디바이스 영향 없음 |
| Active 정상 | 기존 revoke + 새 token (같은 family) |

### 본 spec 에 *없음* (미래 검토)

| 항목 | 의미 | 박는 시점 후보 |
|---|---|---|
| **Absolute timeout** | rotate 박아도 *최초 signin 으로부터 N일* 후 강제 만료 (e.g., 90일). 지금은 rotate 마다 expiresAt 갱신 → 영구 갱신 가능 | session schema 의 `firstIssuedAt` 추가 + 별 spec |
| **Inactivity timeout** | *마지막 rotation 시점 + N분* 미사용 시 만료 | `lastUsedAt` 컬럼 + 별 spec |
| **Device fingerprint** | userAgent / IP / device-id signal *매칭* (hard reject 아님, risk score) | 별 spec — 모바일 IP rotate 빈번 → false positive 다수, *별 risk signal* 로 박는 게 표준 |
| **Rate limit** | rotate 폭주 (per-user / per-IP) 차단 | spec-05-04 auth-security |
| **Concurrent rotation guard** | race condition 시 둘 다 rotate 박는 거 방지 | DB advisory lock 또는 `WHERE revokedAt IS NULL` + unique constraint 강제 |
| **User-wide revoke** | 비번 변경 / 의심 활동 시 user 의 *모든 family* revoke | 별 spec — `revokeAllByUser(userId)` 함수 추가 |
| **Audit log** | rotate / reuse_detected / expired 모든 event 영구 기록 | phase-10 observability |
| **Sliding TTL vs Fixed TTL** | rotate 시 expiresAt 새로 박을지 (sliding) vs 원본 유지 (fixed) 정책 결정 | ADR 추가 검토 필요 — 지금은 *sliding* (rotate 마다 30일 갱신) |

**현재 정책 요약**: minimal — Sliding TTL (rotate 마다 30일 갱신) + reuse detection + expiresAt 거부. 멀티 디바이스는 *family 별 격리* 로 자연 처리. 그 외 모든 정공법 항목은 *후속*.

## 본 패키지 scope 밖 (별 spec / phase)

- NestJS adapter → phase-06 (`@repo/nestjs-auth-session`)
- User table → 별 spec (apps/api 가 자체 정의)
- multi-device tracking (userAgent / ipAddress) → 별 spec (위 정공법 표 참조)
- Redis storage / jti deny list → 별 spec
- 자동 expired session cleanup (cron) → 별 spec
- testcontainers integration test → phase-10
