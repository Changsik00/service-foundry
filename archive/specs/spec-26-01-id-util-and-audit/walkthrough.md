# Walkthrough: spec-26-01

> id 생성 유틸(`@repo/backend-id`) + 내부 uuid 노출 root 감사 — phase-26 안전망 선결.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| public_id 인코딩 | base64url / hex / **Crockford base32** | **Crockford base32 26자(128bit)** | URL-safe + 대소문자 모호(I/L/O/U) 제거, 불투명 |
| 랜덤 소스 | nanoid/ulid dep / **node:crypto** | **`crypto.randomBytes(16)`** | dep 0(기존 token 패턴 일관), platform-agnostic |
| uuidv7 생성 | PG18 SQL / **앱-레이어** | **앱-레이어 RFC 9562** | PG 버전 비의존, 내부 PK 정렬·인덱스 지역성 |
| 패키지 위치 | schema 내 / **신규 core** | **`packages/backend/id`** | framework dep 0, 모든 backend/nestjs 의존 가능(ADR-0015) |

## 💬 사용자 협의

- 길이/uuidv7 위치 2결정 제시 → "제안대로"(128bit + 앱-레이어) 승인.

## 🔍 감사 결과 — public_id 도입 확정 root

독립 Explore 감사(API 응답·JWT 클레임·URL 파라미터 전수):

| Root | 노출 경로 | 처리 |
|---|---|---|
| **users** | signin/signup/refresh `user.id`, JWT `sub`, /auth/me, /admin/users | 26-02 |
| **organizations** | /auth/orgs·/org/members `orgId`, JWT `active_org`, /admin/orgs | 26-04(RLS) |
| **sessions** | GET /auth/sessions `id`, DELETE :id | 26-05 |
| **api-keys** | GET/POST /auth/api-keys `id`, DELETE :id | 26-05 |
| memberships | `userId`/`orgId` → **users/org public_id 상속** | 자체 불요 |
| invitations | 토큰 기반, 객체 미노출 | 불요 |
| mfa / passkey / oauth-accounts | 미노출 | 불요 |

→ 후속 spec(26-02~05) 범위 고정.

## 🧪 검증

- 단위 10/10: 형식(`usr_[Crockford]{26}`)·문자집합·고유성(1e4 충돌 0)·불투명성(정렬≠생성순)·uuidv7 레이아웃(ver=7/variant)·timestamp 인코딩.
- 전체 게이트(fresh 5434 DB): turbo lint+typecheck+test, apps/api **341/341**, 회귀 0. (신규 패키지 런타임 참조 0 — 회귀 위험 무.)

## 🔧 변경

- [NEW] `packages/backend/id` (`@repo/backend-id`, dep 0): `prefix.ts`(ID_PREFIX) · `public-id.ts`(Crockford base32 + publicId) · `uuidv7.ts` · `index.ts` 배럴 + 단위 테스트 3종.

## 🚧 이월

- 실제 컬럼/마이그레이션·경계 정규화·RLS·누출 스냅샷은 26-02~06.
