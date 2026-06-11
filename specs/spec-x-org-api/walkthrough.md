# Walkthrough: spec-x-org-api

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| active org 운반 | Supabase app_metadata+refresh / DB | **DB(users.orgId) — ADR-0026** | verifier provision fallback 이 이미 매 요청 DB 를 읽는 구조 — UPDATE 1회로 즉시 적용, 토큰 불변 |
| accept 재사용 | 복제 / 코어 추출 | **acceptCore 추출 + acceptForProvider** | 검증(C-4/C-5)·멤버십 생성 공용, native 토큰 재발급만 분기 |
| DI | 생성자 암시 주입 | **명시 @Inject(클래스)** | tsx(esbuild) emitDecoratorMetadata 미지원 — 레포 컨벤션. biome 의 type-import 변환과도 충돌 안 함 |

## 🐛 발견·수정한 잠재 버그 2건 (실토큰 프로브가 잡음)

1. **provision port 미주입** — `ProviderAuthModule(global)` 이 `SUPABASE_PROVISION_PORT` 를 exports 에 누락 → verifier 의 @Optional 주입이 조용히 null → **첫 로그인 개인 워크스페이스 자동 생성(ADR-0022 seam)이 전혀 동작하지 않았음** (auth-http-integration 부터 잠복, e2e 가 sub 만 검증해 미탐). exports 에 portToken 추가 + web e2e 에 `orgId` truthy 회귀 가드.
2. **provision email 충돌** — provider 유저 재생성 시 새 uid + 기존 email → insert 가 email unique 위반 (e2e 픽스처 재생성마다 재현). uid 미스 시 **email 재링크** 경로 추가 (provider 가 email 권위 — ADR-0023).

## 🧪 검증 결과

```
단위: org-list 2 / provider-switch 3 / invite(+acceptForProvider) 10 / members-email 1 / provision(+재링크) 5 — TDD
실토큰 프로브 (Supabase 로그인 → api):
  GET  /auth/orgs        200 {orgs:[{orgId,name:"probe-org",role:"owner",isPersonal:true}]}
  GET  /auth/org/members 200 (email join 포함, RLS 자동 스코프)
  POST /auth/org/switch  내 org 200 {orgId} / 무관 org 403
  GET  /auth/me          orgId 비-null (provision 발화 증명)
web e2e 13/13 (orgId 회귀 가드 포함, 2회 연속) · turbo 137+29 · knip 0 · depcruise ✔
```

> 디버깅 노트: 로컬 dev 의 "Failed query" 1차 원인은 **인프라 postgres(5432) 다운** — infra:up + migrate 후 재현 가능해짐. tsx watch 가 변경 후 프로세스를 못 죽이는 현상 2회 (수동 재기동 필요).

## 📦 Commits

1. feat: 내 조직 목록 (get /auth/orgs) + adr-0026
2. feat: provider org 전환 (users.orgid 갱신)
3. feat: provider 멤버·초대 표면 + provision port export 버그 수정
4. fix: provision email 재링크 (provider 유저 재생성 대응)
5. docs: ship
