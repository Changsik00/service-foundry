# spec-x: provider 모드 org API 표면 (목록·전환·멤버·초대) + 잠재 버그 2건 수정

## 목적

테넌트 선택·초대 화면(spec-x-org-screens)의 백엔드 선행 — supabase(provider) 모드에는
`GET /auth/me` 뿐 org 표면이 없었음 (org 서비스들은 native JWT 재발급에 강결합).

## 핵심 설계 — ADR-0026

provider 모드 active org 의 단일 출처 = **DB(`users.orgId`)**. Supabase 토큰에 자체 claim 이 없어
verifier 가 매 요청 provision fallback 으로 DB 를 읽는 기존 구조 → 전환은 UPDATE 1회, 토큰 불변,
클라는 쿼리 invalidate 만. (성능 필요 시 Supabase Auth Hook 업그레이드 경로 기록)

## 신규 표면 (ProviderOrgController — provider 모드 전용 마운트)

| 엔드포인트 | 동작 |
|---|---|
| `GET /auth/orgs` | 내 멤버십 전체 (org·name·role·isPersonal) — 시스템 컨텍스트 (C-4 패턴) |
| `POST /auth/org/switch` | membership 검증 → users.orgId UPDATE → `{orgId}` (무관 org 403) |
| `GET /auth/org/members` | 기존 RLS 검증 표면 재사용 + **email join** |
| `POST /auth/org/invite` | 기존 서비스 재사용 (providerUid 해석 래퍼) |
| `POST /auth/org/invite/accept` | acceptCore(C-4/C-5) + active org 전환 — 토큰 재발급 분리 |

## 🐛 잠재 버그 2건 (실토큰 프로브로 발견)

1. **provision 미발화** — global 모듈이 `SUPABASE_PROVISION_PORT` 를 exports 누락 → @Optional 주입 null
   → **첫 로그인 개인 워크스페이스 자동 생성(ADR-0022 seam)이 동작한 적 없음**. e2e 가 sub 만 검증해
   잠복. 수정 + web e2e `orgId` truthy 회귀 가드 추가.
2. **provision email 충돌** — provider 유저 재생성(새 uid+기존 email) 시 insert 가 unique 위반 →
   email 재링크 경로 추가 (provider 가 email 권위, ADR-0023).

## 검증

- 단위 21건 TDD (Red→Green) · web e2e 13/13 2회 연속 · turbo/knip/depcruise GREEN
- 실토큰 풀패스 프로브: orgs/members/switch(200·403)/me(orgId 비-null) — walkthrough 로그

## 후속

- spec-x-org-screens — TenantSwitcher·/orgs·멤버·초대 수락 화면
