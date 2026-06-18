# spec-x-org-api: provider 모드 org API 표면 (목록·전환·멤버·초대)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-org-api` |
| **Branch** | `spec-x-org-api` |
| **상태** | Plan Accepted |
| **타입** | Feature |
| **Integration Test Required** | yes (CI real-PG e2e — 로컬 Redis 부재) |
| **작성일** | 2026-06-11 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

테넌트 선택·초대 화면(spec-x-org-screens)의 선행 조건. 조사 결과 (spec-x-auth-screens 에서 확인):
- supabase(provider) 모드 api 는 `GET /auth/me` 만 마운트 — org 표면 없음
- 기존 org 서비스: switch·invite-accept 는 **native JWT 재발급에 강결합** / members 는 RLS 순수 / "내 조직 목록"은 native 에도 부재

### 핵심 설계 근거 (조사 발견)

provider 모드의 active org 는 **이미 DB 기반** — Supabase 토큰에 자체 claim 이 없어
SupabaseVerifier 가 매 요청 `provisionFromProvider()` fallback 으로 `users.orgId` 를 읽는다.
→ 전환 = `users.orgId` UPDATE 만으로 다음 요청부터 즉시 적용 (admin SDK·토큰 refresh 불요).
ADR-0022 의 "active org = 토큰 클레임" 은 native 모드 서술 — provider 모드의 DB-기반 운반을
ADR-0026 으로 명문화한다.

## 🎯 요구사항

1. **`GET /auth/orgs`** — 내 멤버십 전체 (org id·name·내 role). 교차-org 조회이므로 시스템 컨텍스트(runWithSystemTenant) 필요
2. **`POST /auth/org/switch`** (provider) — membership 검증 → `users.orgId` 갱신 → `{ orgId }` 반환 (native 의 accessToken 재발급과 다름 — 클라는 쿼리 invalidate 만)
3. **`GET /auth/org/members`** — 기존 RLS 경로 재사용 + **email join 보강** (화면 표시용)
4. **`POST /auth/org/invite` / `invite/accept`** (provider) — invite 는 기존 서비스 재사용, accept 는 토큰 재발급 분리(멤버십 생성 + active org 전환)
5. **ProviderOrgController** — ProviderAuthModule 에 마운트, AuthGuard 보호
6. **ADR-0026** — provider 모드 active-org 운반 = DB(users.orgId) + verifier provision fallback (성능 trade-off 포함)

## 🚫 Out of Scope

- 프런트 화면 전부 → spec-x-org-screens
- 조직 생성/이름변경/탈퇴 API (목록·전환·초대 수락이 화면 요구의 전부)
- provider custom-claim 운반(Supabase Auth Hook) 전환 — ADR-0026 에 대안으로 기록만
- native 모드 org 동작 변경 (기존 e2e 보존)

## ✅ Definition of Done

- [ ] 단위 TDD + CI e2e GREEN (native 회귀 포함)
- [ ] ADR-0026 + ship + PR
