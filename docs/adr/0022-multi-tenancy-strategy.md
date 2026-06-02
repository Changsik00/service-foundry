---
id: ADR-0022
type: decision
date: 2026-06-02
status: accepted
---

# ADR-0022: 멀티테넌시 전략 — 조직 기반 SaaS 기준 데이터 모델

## 📚 Context

service-foundry 는 "실제 서비스 제품의 대부분을 담는 대형 보일러플레이트"를 지향한다(YAGNI 면제 — 안 쓰면 지운다). signup/login·OAuth·MFA·passkey 등 인증은 이미 깊으나, 그 위에 올릴 도메인·인가·빌링·어드민이 모두 **테넌시 모델**에 의존한다. 테넌시는 ②형(교차절단) 결정 — 모든 테넌트 테이블에 스코프가 스며들어 *나중에 넣기도 빼기도 침습적*이라, 기준 데이터 모델을 지금 못박아야 한다.

요즘 SaaS 대세가 조직(워크스페이스) 기반이므로 **멀티테넌트**로 확정한다. 멀티테넌시가 강제하는 4개 갈림길을 함께 결정한다.

## 🎯 Decision

조직 기반 멀티테넌트를 기준 데이터 모델로 채택한다. 4개 설계 결정:

1. **격리 모델 = 공유 스키마 + `org_id` + Postgres RLS.** 단일 DB, 모든 테넌트 테이블에 `org_id` 컬럼, RLS 정책으로 행 격리(앱 버그 시에도 누수 방지 — defense-in-depth).
2. **멤버십 = 멀티 조직 + 전환.** 한 유저가 여러 org 에 소속(`memberships` 테이블), access token 의 `active_org` 를 전환 endpoint 로 바꾼다.
3. **가입 = 개인 워크스페이스 자동 생성.** signup 시 personal org + owner 멤버십을 트랜잭션으로 생성 → solo 유저도 즉시 사용, 이후 팀 초대/조직 생성.
4. **active org 컨텍스트 = access token 클레임 + 전환 endpoint.** 토큰에 `active_org_id`(+ org-role) 클레임, 전환 시 토큰 재발급. (인증 권위가 provider 면 provider custom-claim 으로 운반 — → [[ADR-0023]].)

요청 처리 시 active org_id 를 AsyncLocalStorage 컨텍스트에 주입하고, DB 세션 변수(`app.current_org`)로 set → RLS 정책이 이를 읽어 자동 스코프.

**유저 프로비저닝 seam (중요 — provider 모드 대비)**: "신규 유저 → 개인 org + owner 멤버십 생성" 로직은 **단일 공용 함수(seam)** 로 만든다. native signup(`POST /auth/signup`) 과 provider-first-login(Firebase/Supabase 에서 가입한 유저를 백엔드가 처음 본 순간 — → [[ADR-0023]]) 가 **같은 seam 을 호출**한다. 이 seam 을 phase-18(spine)에서 native 전용으로만 만들면 phase-19(provider 모드)에서 별도 경로를 또 만들어야 하므로(재작업), 처음부터 "유저가 어디서 왔든" 호출 가능한 형태로 설계한다.

## 📊 Consequences

- **긍정**: 모든 후속(도메인·RBAC·빌링·어드민)이 일관된 org 스코프 위에 쌓인다. RLS 가 앱 레벨 실수의 안전망. 멀티조직/개인워크스페이스로 B2C·B2B·solo 다 커버.
- **부정 (retrofit 비용)**: 기존 테이블(`users`·`sessions`·`failed_logins`·`lockouts`·audit 등)에 `org_id` + RLS 추가. 전역 `role` → **org별 멤버십 role**(owner/admin/member)로 의미 이동. JWT 클레임·signup 서비스·AuthGuard(컨텍스트 주입) 모두 수정. → phase 단위로 단계적 마이그레이션.
- **부정 (불가역성)**: 멀티테넌시는 한번 박으면 단일테넌트로 되돌리기 어려움. 단, 보일러플레이트를 단일테넌트로 쓰려는 사용자는 `org_id`/RLS/memberships 를 *제거*하는 방향(삭제는 추가보다 쉬움)으로 다운그레이드 가능.
- **중립**: 신규 엔티티 `organizations`·`memberships`(user×org×role)·`invitations`(이메일 초대→수락).

## 🔀 Alternatives

- **단일 테넌트(개인 계정)**: 가장 단순하나 SaaS 현실성 부족, 조직 기능 후 추가가 대공사. 비채택.
- **유저당 단일 조직**: membership 단순화하나 멀티조직 확장이 침습적. 모던 SaaS(Slack/Notion/Linear)는 멀티조직이 표준 → 비채택.
- **스키마/DB per tenant**: 강한 격리(엔터프라이즈)지만 마이그레이션·운영·비용 복잡. 보일러플레이트 기본으로 과함 → 공유 스키마+RLS 가 ROI 우위.
- **org 필수(개인 워크스페이스 없음)**: 순수 B2B. solo 온보딩 마찰 → 개인 워크스페이스 자동생성이 더 유연.
- **active org = 서브도메인/헤더**: 서브도메인은 로컬·배포·쿠키 복잡, 헤더는 매 요청 검증 책임↑. 토큰 클레임이 stateless·일관.

## 📌 Status

Accepted (2026-06-02, 멀티테넌시 로드맵 착수 시점). 첫 구현: phase "멀티테넌시 foundation"(org/membership/invitation + org_id retrofit + RLS + 토큰 org 클레임 + 전환). 이후 phase(계정·인가·데이터UX·어드민·빌링)가 본 결정에 의존.

## 🔗 Related

- [[ADR-0023]] — 인증 권위 모드(native/firebase/supabase) + app 클레임 운반
- [[ADR-0021]] — CSRF 바인딩(csrf_id), [[ADR-0014]] — auth security baseline
- 이슈 #20 (RBAC/ABAC/ReBAC) — org 스코프 인가가 본 결정 전제
- 로드맵: `backlog/queue.md` 대기 Phase
