---
id: ADR-0024
type: invariant
date: 2026-06-08
status: accepted
---

# ADR-0024: 테넌트 격리 강제 — 비-슈퍼유저 role + 요청 스코프 RLS 컨텍스트

## 📚 Context

멀티테넌시 spine(phase-17)은 테넌트 격리를 Postgres RLS 로 보장한다. 그러나 RLS 는 두 가지를 동시에 만족해야만 *실효*가 있다: (1) 연결 role 이 RLS 적용 대상이어야 하고(슈퍼유저·테이블 owner 는 RLS 를 우회 — `FORCE` 도 슈퍼유저엔 무력, 실측), (2) 매 요청이 자신의 org 를 DB 세션 변수로 *실제로* 설정해야 한다.

phase-17 초기 구현은 둘 다 놓쳤다: 앱이 `postgres` 슈퍼유저로 접속했고(우회), JWT 클레임명 불일치(서명 `activeOrgId` / 가드 `orgId`)로 컨텍스트가 영영 설정되지 않았다. 격리를 검증한 테스트는 raw SQL 로 요청 경로를 우회해 거짓 GREEN 을 냈다 (회고: `docs/review/2026-06-08-phase-17-review.md`).

## 🎯 Decision

테넌트 격리는 다음 불변식으로 강제한다:

1. **런타임 접속은 비-슈퍼유저 role `app_runtime`** 으로 한다(마이그레이션은 owner 분리). production 부팅 시 런타임이 슈퍼유저면 거부(`apps/api/src/settings.ts`).
2. **요청 스코프 트랜잭션 + `set_config('app.current_org', …, true)`** 로 org 컨텍스트를 주입하고, `DATABASE.db` 를 ALS-tx 라우팅 proxy 로 감싸 *모든 쿼리에 자동 적용*한다(core `@repo/backend-tenant`: `createTenantDb`/`TenantAls`/`runWithSystemTenant`, adapter `@repo/nestjs-tenant`: `TenantContextInterceptor`/`TenantModule` — spec-24-05 패키지 이관).
3. **클레임명은 공유 상수**(`ACTIVE_ORG_CLAIM`/`ORG_ROLE_CLAIM`, `packages/backend/auth-jwt/src/claims.ts`)로 고정 — 서명측·검증측 표류 금지.
4. **RLS 는 org-스코프 도메인 테이블에만**(organizations·memberships·invitations) 적용. 인증 인프라(users·sessions·failed_logins·lockouts·auth_audit_logs)는 org-스코프 데이터가 아니므로 RLS 를 적용하지 않는다.
5. **정당한 cross-org 조작**(토큰 기반 invite accept)은 `runWithSystemTenant` 로 같은 tx 안에서 컨텍스트를 비워 처리한다(원자성 유지).
6. **격리 검증은 실 HTTP 경로**(토큰→guard→interceptor→RLS)를 통과하는 통합 테스트로 한다. raw SQL/mock 만으로 성공 기준 충족을 선언하지 않는다.
7. **인증됐는데 org 컨텍스트 없으면 fail-closed**(spec-x-null-org-isolation-failclose): `req.user` 가 있는데 `orgId` 가 없으면(예: OAuth 로그인·org 미설정 토큰) interceptor 가 **불가능 컨텍스트(nil-uuid)** 로 tx 를 열어 RLS 가 전 org-scoped 행을 차단한다. NULL 컨텍스트 퍼미시브는 **미인증(부트스트랩)** 에만 허용 — 인증-무org 가 같은 경로로 빠져 전 테넌트가 노출되던 누수를 차단. 정당한 무-org 흐름(내 org 목록·전환·초대수락)은 `runWithSystemTenant` 로 system 컨텍스트를 명시 토글하므로 무영향.

## 📊 Consequences

- **긍정**: 격리가 운영 경로에서 실제로 강제됨. 클레임 표류·거짓 GREEN 재발 차단. 인증 인프라가 컨텍스트와 무관하게 동작(세션/로그인 회귀 없음).
- **부정**: 인증 요청이 요청-스코프 tx 로 커넥션을 점유 → 동시 인증요청 수가 풀 크기에 제한(운영은 풀 상향 + pgbouncer tx 모드 권장). 배포 시 `app_runtime` role·비밀번호 프로비저닝 필요.
- **쓰기 강제(후속 반영)**: 도메인 테이블 정책에 `WITH CHECK (org_id = 컨텍스트)` 적용(0014) — 컨텍스트 NULL/빈문자열(시스템 컨텍스트)은 허용. 부팅 시 `pg_roles.rolsuper` 확인으로 production 슈퍼유저 런타임 거부(`superuser-guard.provider.ts`). (spec-x-tenant-isolation-hardening)

## 🔀 Alternatives

- **전 테이블 org_id 백필 + RLS**: 인증 인프라까지 org_id 강제 — 비채택: 세션/rate-limit 회귀 + user 의 다중-org 멤버십 의미와 충돌.
- **애플리케이션 레이어 `WHERE org_id` 필터**: RLS 대신 코드 필터 — 비채택: 누락 시 조용한 유출, SoT 분산.
- **슈퍼유저 + `FORCE RLS`**: 비채택 — 슈퍼유저는 FORCE 도 우회(실측).

## 📌 Status

Accepted (2026-06-08, spec-17-08 머지 시점). 첫 사용자: `apps/api` (auth/org 도메인). 쓰기 강제 + 부팅 슈퍼유저 가드는 spec-x-tenant-isolation-hardening 에서 보강.

## 🔗 Related

- spec-17-07(DB 메커니즘), spec-17-08(요청 경로 배선) · 회고 `docs/review/2026-06-08-phase-17-review.md`
- ADR-0022(멀티테넌시 전략) · ADR-0023(auth authority modes)
- 메모리: 격리 e2e 는 실 HTTP 경로 필수
