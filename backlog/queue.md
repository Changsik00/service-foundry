# Backlog Queue

> 본 문서는 *대시보드* 입니다. "지금 무엇을 하고 있고, 다음에 무엇을 해야 하는가"를 한눈에 보기 위함.
>
> **자동 갱신 마커**: `active`, `specx`, `done` — 마커 (`<!-- sdd:... -->`) 사이는 sdd가 관리하므로 그대로 두세요.
> **사람 편집 섹션**: `🧊 Icebox`, `📋 대기 Phase` — 자유 메모.

## 📦 진행 중 Phase

<!-- sdd:active:start -->
(active phase 없음. `bin/sdd phase new <slug>` 로 시작)
<!-- sdd:active:end -->

## 📥 spec-x 대기

<!-- sdd:specx:start -->
- [ ] spec-x-native-list-orgs — native-list-orgs
<!-- sdd:specx:end -->

## 🧊 Icebox

> 아이디어·보류 항목 보관소. 실행 불가. 관련 항목이 쌓이면 Phase로, 단발이면 spec-x로 승격.
> 이 섹션은 sdd가 건드리지 않습니다. 자유롭게 편집하세요.

- ~~apps/admin 별도 앱 여부 결정~~ **해소**: 별도 admin 앱 없음 — `apps/web` 단일 앱이 콘솔(어드민 성격) 역할 (ADR-0025, 2026-06-10)
- [ ] tailwind를 packages/frontend/ui에만 둘지 각 앱에도 설치할지 (phase-04)
- ~~Drizzle/Prisma 마이그레이션 공통 wrapper~~ **해소**: ADR-0005 Drizzle 단일 결정 (2026-05-18, spec-x-auth-foundation-prep)
- [ ] Integration test orchestration: testcontainers (per-test 격리) vs docker-compose snapshot (전체 환경 미리 부팅) (phase-10)
- [ ] Hono apps/edge-api scope: 같은 `/api` 모방 / 다른 엔드포인트 / Cloudflare Workers 전용 데모 (phase-09)
- [ ] commit-time hook 명령 set (Biome only / + typecheck / + affected test) (phase-03~10 중 결정)
- ~~보안 linter (semgrep / socket.dev) 추가 여부~~ **해소**: ADR-0019 No-Go (phase-15 CI 재평가) — spec-10-03 (2026-05-30)
- [ ] check-secrets 훅 false positive 개선 — compose/env 의 `${VAR:-default}` 보간값을 시크릿으로 오탐 (spec-10-01 에서 2회 warn 우회). `${...}`-only 값 무시 또는 allowlist. spec-x 후보 — **RCA-002 작성됨** (spec-14-07, docs 예시도 오탐)
- ~~🔒 **CSRF 미배선**~~ **→ phase-15-01 로 승격** (2026-06-01, wiring audit §A)
- ~~**생성기 backend tsconfig `types:["node"]` 누락**~~ **→ phase-15-05 로 승격** (2026-06-01, wiring audit §E)
- [ ] **wiring audit 🟡 의도적 미배선 항목들** (passkey env · HttpClient/Settings DI · 프론트 MFA/Passkey UI · RequireAuth · provider 교체 — ~~web-vite theme~~ ADR-0025 로 소멸) — 보일러플레이트 의도적, 필요 시 개별 승격. `docs/review/2026-06-01-wiring-audit.md` §🟡
- ~~**MFA/passkey 상태변경 POST 8개 CSRF 보호**~~ **해소**: `spec-16-01` (2026-06-02) — CsrfGuard 전체 8 endpoint 적용 완료
- ~~**CSRF/OAuth secret production 가드**~~ **해소**: `spec-16-02 phase-FF` (2026-06-02) — `DEV_DEFAULT_SECRET` 체크 + production 기동 거부 적용 완료
- [x] ~~**web(구 web-next) CSRF 403 자가복구**~~ **부분 해소**: `apps/web/src/lib/auth-api.ts` `withCsrfRetry` 구현 완료 (2026-06-09). **잔여**: 401 자동 갱신 → `spec-x-auth-token-refresh-interceptor` (spec-x 대기), password-reset/email-verify 클라이언트 흐름 (~~web-vite CSRF 헤더~~ ADR-0025 로 소멸)
- [ ] **email-verify 흐름 구현 시 Supabase "Confirm email" ON 복귀 필수** (2026-06-11 결정) — dev 는 현재 OFF(autoconfirm: 가입 즉시 email_verified=true 도장, 의미 거짓 — env.sample 주석). 검증 분기를 실제 구현하는 spec 에서 ON 복귀 + e2e 는 `admin.generateLink(type: 'signup')` 으로 확인 링크 방문 패턴 (메일 클릭 자동화 대체). OFF 인 채 검증 분기를 만들면 영원히 거짓 GREEN
- [ ] **knip-config ignoreDependency 정리** (phase-15 회고 W4) — spec-15-02 가 `@repo/backend-auth-rate-limit` 실배선 후 spec-15-01 등록 ignore 잔존 → knip 40 redundant hint. 배선 완료 dep 의 ignore 제거. 비차단, 정리 항목
- ~~**configureApp SoT 에 applySecurity 흡수** (phase-15 2차회고 V1)~~ **해소 확인** (2026-06-17) — `configureApp` 가 이미 `applySecurity`(helmet/CORS) 흡수(spec-16-02) + e2e 보안헤더 검증 존재(`auth.e2e.test.ts` "보안 헤더 (helmet/CORS)" → x-content-type-options=nosniff)
- [ ] **web e2e/로컬 dev 의 RLS 우회** (spec-x-org-screens 발견, 2026-06-11) — dev·web-e2e 의 DATABASE_URL 이 postgres superuser 라 RLS(defense-in-depth)가 통째로 비활성. 격리는 api e2e(runtime role, spec-17-08)가 검증하지만, dev 환경도 app_runtime role 로 전환하면 화면 개발 중 격리 버그를 조기 발견 가능. compose/migrate 의 role 부여 흐름 정리 필요. spec-x 후보
- ~~**csrf.ts 주석 drift 정정** (phase-15 2차회고 V2)~~ **해소 확인** (2026-06-17) — `csrf.ts` 주석이 이미 ADR-0021(per-client csrf_id, session 비의존)과 일치. 폐기된 session-binding 설명 없음
- [ ] **MFA 추가 factor: SMS/이메일 OTP** (2026-06-02) — 현재 MFA 는 TOTP(인증앱)+백업코드+passkey 만. `auth/mfa/totp` 네임스페이스는 다른 factor 여지를 둔 설계이나 미구현. SMS(twilio 등)/email OTP factor 는 **기능 추가**(보안 하드닝 phase-16 과 별개) → 별도 phase/spec 후보. 외부 의존(SMS provider)+비용·검증 흐름 설계 필요
- ~~**테넌트 쓰기 경로 RLS 강제**~~ **해소**: `spec-x-tenant-isolation-hardening` (2026-06-08) — WITH CHECK 정책 적용, cross-org INSERT/UPDATE 거부 e2e 검증 완료
- ~~**production 슈퍼유저 가드 강화 (W-5)**~~ **해소**: `spec-x-tenant-isolation-hardening` (2026-06-08) — `SELECT rolsuper` DB 사실 기반 확인으로 강화 (BYPASSRLS·타 슈퍼유저 포착)
- ~~**이메일 실전송 검증 (W-6)**~~ **해소**: `spec-x-tenant-isolation-hardening` 회고 (2026-06-08) — 기존 어댑터 테스트 충분 확인, 실 live-send 는 실 키·인박스 필요로 자동화 한계 명시
- ~~**ADR `tenant-isolation-runtime-role-and-als-tx`**~~ **해소**: `docs/adr/0024-tenant-isolation-enforcement.md` (spec-17-08)
- [ ] **운영 DB 풀 사이징 / pgbouncer 가이드** (2026-06-07) — spec-17-07 요청-스코프 tx 는 동시 인증 요청 수를 풀 크기로 제한. 운영 풀 상향 + 커넥션 풀러(tx 모드) 권장. infra phase(22) 후보
- [ ] **[제안] Proactive Token Rotation** (2026-06-09) — `spec-x-auth-token-refresh-interceptor` A방식 이후 후속. `SignResponse`에 `expiresAt` 추가 → auth-sdk 저장 → AuthProvider 타이머로 만료 2분 전 자동 `refresh()`. 사용자가 401을 아예 안 만남(UX 최상). 구현 복잡도: 타이머 + 탭 포커스 재진입 + contracts 변경. 진입 시점: phase-19 이후 또는 실제 불만 보고 이후 권장
- [ ] **k8s 드리프트 테스트 CI 자동화** (spec-22-01, 2026-06-16) — `tooling/k8s/__tests__/manifest-drift.test.ts` 가 tooling 비-패키지라 `turbo run test` 에 안 잡힘. 현재 `npx vitest run tooling/k8s` 수동. root vitest 또는 tooling 패키지화로 CI 편입. spec-x 후보
- [ ] **k8s 운영 리소스 확장** (spec-22-01) — helm/kustomize overlay · Ingress/TLS · HPA/PDB · PVC(StatefulSet) · NetworkPolicy. 샘플은 의도적 제외(README 확장 포인트). 필요 시 후속 phase/spec
- [ ] **`@env-kit/node-settings` 의 next 의존 제거/대체** (spec-22-02, 2026-06-17) — slim api/worker 이미지에 `next`(~288MB)가 잔존. `@env-kit/node-settings@1.1.0` 이 `next` 를 직접 의존 → backend-settings 경유 api 까지 끌려옴. 해당 dep 제거/대체 시 이미지 추가 대폭 감소. spec-x 후보
- [ ] **이미지 추가 슬림** (spec-22-02 후속) — 컴파일(tsup → node 런타임, tsx 제거) + distroless 베이스. 현재 tsx 런타임 유지. 후속 spec 후보
- [ ] lat.md Phase 2 도입 평가 (지식 그래프 도구)
- ~~ARCHITECTURE.md 본체 재작성~~ **해소**: `spec-x-docs-ssot` (2026-06-18) — SSOT 정책(CONVENTIONS §2.5) + 루트 ARCHITECTURE→원칙+포인터 + reference 최신화
- [ ] **turbo generator 앱 템플릿 drift** (spec-x-docs-ssot 발견) — `turbo/generators/config.ts` 가 app 스캐폴딩에 `vite` 옵션 제공하나 `turbo/generators/templates/app/` 디렉토리 부재(web-vite 폐기 잔재). config 옵션 정리 필요. 코드 drift, spec-x 후보
- [ ] **ci-verify-gate explainer web-vite 잔재** (spec-x-docs-ssot 발견) — `docs/explainers/platform/ci-verify-gate.md` 가 폐기된 web-vite routeTree 빌드 의존을 설명. explainer 갱신 필요(단순 이름치환 아님)
- [ ] **🔌 web ↔ native 모드 라우트 부정합 — `/auth/orgs` 갭** (2026-06-24 로컬 dev 확인) — 웹(apps/web)이 org 목록/스위처로 `GET /auth/orgs` 호출하는데 이는 **provider 모드 전용**(`ProviderOrgController.orgs` → `org-list.service.listForProviderUid`). **native 모드 `OrgController` 엔 list-my-orgs 엔드포인트 없음**(org/members·switch·invite 만) → native dev 에서 스위처 404. 역으로 provider 모드엔 웹이 쓰는 `/auth/csrf`·`/auth/sessions`(native 전용)가 없음 → 웹이 단일 모드로 완전 동작 안 함. 수정안: native `OrgController` 에 `GET /auth/orgs`(내 멤버십 org 목록, `OrgListService` 를 native sub 키로 재사용) 추가 → 웹이 native 에서 완전 동작. spec-x 후보(작음). 관련 wiring audit.

#### 🔁 phase-24 회고 이월 (2026-06-23, `docs/review/2026-06-23-phase-24-review.md`)

- [ ] **🔒 테넌트 격리 방어선 보강 (defense-in-depth, 보안)** — spec-x-null-org-isolation-failclose(#179)로 누수는 차단했으나 방어선이 얇은 3건: **(A)** `0013` 이 인증 인프라(users·sessions·failed_logins·lockouts·auth_audit_logs) RLS 를 *비활성* → 이들은 WHERE+엔드포인트노출 통제에만 의존(interceptor fail-close 무력). 비-admin 의 무-WHERE `users` 읽기 audit 필요. **(B)** raw `pool.query` 경로(org-switch·api-key)는 interceptor 컨텍스트 밖 — 명시 WHERE 가 유일 방어. **(C)** `org-members.service` 는 방어적 `WHERE org_id` 없이 RLS 단일 의존. → spec-x/phase 후보
- [ ] **A5 목록 limit** (phase-24 phase-FF 미착수, 유일한 실 잔여) — `feature-flag.service.ts:13` 무제한 `select().from(featureFlags)`, org-list 도 limit 부재. 페이지네이션 보강. (B4 worker logger·knip ignore 는 이미 완료 확인)
- [ ] **auto 모드 거버넌스 정식화** — constitution 에 "Mode E — Auto"(ADR-009) 미정의. Turbo 는 cross-cutting/아키텍처 명시 금지인데 auto 로 E1(RLS)·E2(schema) 수행함. 적용 범위 + "보안/cross-cutting 은 auto 라도 종료 전 독립검증(/hk-refute) 1회" 규칙 명문화. (harness 본체 변경 — kit 이슈/로컬)
- [ ] **route-inventory Wd 근본 개선** — `route-inventory.test.ts` 가 컨트롤러 미인스턴스화(리플렉션만) → DI·가드 실행순서·body 검증 미확인. 17 하드코딩 brittle. (phase-23 Wd 이월 지속)
- [ ] **신규 패키지 reference 문서** — `@repo/backend-tenant`·`@repo/nestjs-tenant`·`@repo/backend-schema` 3종 `docs/reference/packages/` 항목 미작성
- [ ] **sdd ship post-sync 본체 개선** (RCA 후보, 3회+ 반복) — spec 표 Merged 동기화 커밋이 매 spec 수동 반복(P? 우선순위 정정 포함). `sdd ship` commit scope 에 phase.md 표+본문 포함하도록 harness 개선
- [ ] **E3/E4 패키지 이관** — E3(provision·org 도메인 서비스 분리), E4(superuser-guard·feature-flag·cookie/csrf 패키지화). D2/D3/D4/D6 팩토리 중복 제거. → 다음 리팩토링 phase 후보

### 🛠 리팩토링 감사 인벤토리 (2026-06-18, 7차원 코드레벨 스캔)

> spec-x-docs-code-drift 직후 전체 리팩토링 대상 감사. **A 핫패스/F 분할/G 테스트부채는 Phase 승격 후보**, 일부는 착수 전 건별 검증 필요. 첫 퀵윈은 `spec-x-refactor-tidy` 로 분리(상수/데드코드/sleep중복/console).
>
> **✅ phase-23 반영 (2026-06-19)**: A1·A2·A3·A4(spec-23-02) · B(실태 재해석 → ADR-0027 전역 AppError 필터 + oauth, spec-23-04 / 23-07 필터 하드닝) · C(spec-x-refactor-tidy + spec-23-03) · D1·D5(refactor-tidy·23-03) · F1 auth.controller 3분할(23-06) · F3·F4(23-05).
> **🧊 이월 (다음 phase/후속)**: **A5** 목록 limit · **B2** 컨트롤러 zod 3패턴 통일(미테스트 컨트롤러 안전망 선행) · **D2/D3/D4/D6** verifier·adapter·forRoot·guard 팩토리 · **E** 패키지 이관 → **phase-24** · **F2** account.controller(277) 분할 → spec-23-07 회고서 식별 · **G** 컨트롤러 단위테스트(account/mfa/oauth/passkey/session/org) · **로컬 e2e DB setup**(검증 공백 해소) · **Serena 일관 적용**(grep 회귀 방지).
> **🧊 phase-23 회고(/hk-phase-review) 잔여 Warning** (사용자 결정: 이월): **Wa** `oauth.service.getClientId/Secret` 설정된 provider인데 env 없으면 `?? ""` 조용한 빈 시크릿 → fail-fast(throw) · **Wb** `account.stores.test` 가 23-02에서 가드대상 코드와 동일 커밋 재작성 → 독립성 상실(SQL 모델 아닌 신구현 거울; test-cov 패널은 Critical 평가) → 실DB/integration 가드로 재작성 검토 · **Wd** `route-inventory.test` 컨트롤러 미인스턴스화(DI 회귀 CI 전용) + 가드 **순서** 미검증 + 17 하드코딩 brittle · **We** role enum 컴파일타임 캐스트만(런타임 검증 0) · **Wf** AppError 필터 5xx→4xx 의미변경 ADR-0027 미문서화.

- **A. 버그성·핫패스 (P1)** — A1 `account.stores.ts:82 isSoleOwnerOfAnyOrg` N+1(+early-exit 누락) → 단일 집계쿼리 / A2 `api-key.service.ts:89` 매 호출 `last_used_at` UPDATE → fire-and-forget / A3 `jwks.controller.ts` 매 요청 JWKS 재계산 → 메모이즈(⚠️ key rotation 무효화 필요) / A4 `signin.service.ts:91` 독립 await 순차 → Promise.all / A5 org-list·feature-flag 목록 limit 부재. ❌반려: tenant.interceptor tx 래핑은 RLS SET LOCAL 필수라 정상.
- **B. 컨벤션 (P2, 건별 검증)** — B1 `throw new Error()` ~14곳→AppError(ADR-0020, 일부 부트스트랩 의도적) / B2 raw zod `.parse()` ~8곳→`parse()` Result(ADR-0010) + 컨트롤러 검증 3패턴(zodPipe/parseOr400/수동) 통일 / B3 정당화 없는 `as unknown as`(superuser-guard, express req) / B4 worker `console.*`→logger.
- **C. 상수화 (P1-P2)** — C1 `signup.service.ts:36` `activeOrgId` 문자열 하드코딩→`ACTIVE_ORG_CLAIM`(spec-17-08 drift 클래스, 최우선) / C2 세션 TTL 30d ms·sec 산재(단위불일치) / C3 `["owner","admin"]`→`@repo/backend-authz` 상수 / C4 이메일토큰 24h·비번리셋 15m·페이지네이션 20/100·`"Bearer "`·쿠키/스킴명.
- **D. 중복 (P1-P2)** — D1 `backend/http-client` `sleep()` 재구현→`@repo/utils`(즉시) / D2 firebase·supabase verifier 공통 claim추출+provision 헬퍼 / D3 frontend auth 어댑터(native/fb/sb) 팩토리 / D4 NestJS `forRoot` DynamicModule 팩토리(6모듈) / D5 `CursorPaginationResult<T>` 공유타입 / D6 Roles/OrgRoles guard 제네릭+bearer 헬퍼.
- **E. 패키지 이관 (아키텍처급)** — E1 RLS tenant infra(`apps/api/infra/tenant.*`)→backend+nestjs(worker 재사용, P1) / E2 Drizzle 스키마(`apps/api/infra/schema/*`)→`packages/backend/schema`(org도메인 선결, 50+파일) / E3 provision·org 도메인 서비스 auth모듈서 분리 / E4 superuser-guard·feature-flag·cookie/csrf·web jwt decode 패키지화.
- **F. 복잡도·구조 (P2-P3)** — F1 `auth.controller.ts` 639LOC→Auth/Session/Org 분할(+auth.module 229) / F2 `account.controller.ts` 277 email-change·avatar 분리 / F3 `role:string`→OrgRole/Role enum / F4 OAuthUserInfo discriminated union.
- **G. 테스트 부채 (P1)** — mfa.service·oauth.service·account.controller·passkey.controller·mfa.controller·jwt.service 등 ~11 모듈 무테스트. 위 리팩토링 회귀 안전망 선결.
- **H. 데드코드 (안전)** — frontend/ui 미사용 export ~10(CardFooter·HealthCard+types·*Props·buttonVariants, ⚠️knip 재실행 확인) / card-canvas depcruise orphan은 오탐(재실행).

→ **제안 Phase: `리팩토링/하드닝`** — G(테스트 안전망) → A(핫패스) → C·D(상수·중복) → E(이관)/F(분할) 순 spec 분할.

### 🐛 spec-02-01/02에서 발견된 이슈/주의 사항

- [x] ~~**lefthook typecheck quirk**~~ — 2회 발생(spec-02-01 + spec-02-02) → **RCA-001 작성 + lefthook.yml fix 적용** (2026-05-18 resolved) → `docs/rca/RCA-001-lefthook-typecheck-non-blocking.md`
- [ ] **shared/* DOM lib 패턴 표준화** — 2회째 적용(spec-02-01 utils + spec-02-02 errors). `@repo/typescript-config`에 `env-agnostic` 변형 추가 spec 후보. Phase 2 후반 또는 별 spec에서 결정.
- 📚 **Biome auto-modernize 적용**: `Object.prototype.hasOwnProperty.call` → `Object.hasOwn` (ES2022 표준). 학습 사항 — 액션 불필요.
- 📚 **vitest "no tests in file" 룰**: 빈 test 파일 = exit 1. cleanup-only commit 분리 시 *test 파일을 통째로 두지 않거나 placeholder describe 유지*. 학습 사항 — 액션 불필요.

## 📋 대기 Phase

> 다음에 진행할 phase 를 자유롭게 메모합니다 (사람이 직접 편집).
> 자동 갱신되지 않습니다 — Icebox 와 동일한 정책.

> **2026-06-02 멀티테넌트 SaaS 로드맵 확정·재조정** (ADR-0022/0023). 9 → **6 phase** 로 묶음.
> phase-03~17 완료 (done 섹션 참조). 단계적 구현이되 빠짐없이 기록(까먹지 않기).

- **phase-19** — 계정 완성 + 인가 (**이슈 #20**):
  - 비밀번호 변경 · 이메일 변경(+재검증) · **회원 탈퇴(GDPR — org owner 처리)** · 프로필(이름/아바타) · 세션/기기 관리(목록·취소·전체 로그아웃) · **OpenAPI/Swagger**
  - org-role 기반 **RBAC** RolesGuard 배선 + ABAC/ReBAC policy guard(`canXxx(user,resource)`) · API Key(org 스코프)

- **phase-20** — 데이터 UX:
  - 파일/아바타 업로드(storage 포트 배선) · 전문검색·필터 · 페이지네이션(pagination-contracts 배선) · CSV export/import · soft-delete/데이터 보존(org 스코프)

- **phase-21** — 어드민 + 빌링:
  - 어드민 패널(유저/조직 관리·임퍼소네이션·감사로그 뷰어) · 피처플래그 · 인앱 알림·아웃바운드 웹훅
  - (선택) org당 구독/플랜(Stripe) · 결제수단·인보이스 · 플랜별 entitlement/기능 게이팅

- **phase-22** — Deploy (k8s manifest): `tooling/k8s/` sample manifest — infra, 맨 뒤 (`backlog/phase-22.md`)

> **이슈 처리 매핑** (까먹지 않기):
> - #108 → ADR-0023 결정 → 구현 **phase-18**
> - #20 (RBAC/ABAC/ReBAC) → **phase-19**
> - #21 (라이브러리 discussion) → 대부분 확정(NestJS/Drizzle/native+provider) → 코멘트 정리
> - #19 (phase별 라이브러리 후보) → 본 로드맵에 반영

> **순서 근거**: 이메일(전제)+spine → 인증 권위 모드(provider→org, spine 직후) → 계정+인가 → 데이터 → 어드민+빌링 → infra.
> **묶음 근거**: 이메일=spine 첫 spec(전제 관계), 계정+인가=org 컨텍스트 위 동일 크기, 어드민+빌링=운영 관심사 동일. 9→6 phase.

> **완료 (spec-x)**: 보안 결함 reset/verify raw 토큰 평문 로깅 → NODE_ENV 가드 (PR #67, 2026-05-30). 근본 해소(notification 실 어댑터)는 phase-17.

## ✅ 완료

<!-- sdd:done:start -->
없음
- [x] spec-x-roadmap-migration (완료)
- **phase-01** — 모노레포 골격 (Monorepo Skeleton) — completed 2026-05-17
- **phase-02** — Shared Primitives — completed 2026-05-18
- [x] spec-x-auth-foundation-prep (완료)
- **phase-03** — Backend Foundation — completed 2026-05-20
- **phase-04** — Frontend Foundation — completed 2026-05-20
- [x] spec-x-frontend-dev-fixes (완료)
- [x] spec-x-frontend-foundation-followup (완료)
- **phase-05** — Auth Foundation · Core (contracts/session/jwt/password/rate-limit/reset/verify) — completed 2026-05-21
- **phase-06** — Auth Foundation · Adapters + Login Slice (nestjs/react/cookie/audit/e2e) — completed 2026-05-22
- **phase-07** — Auth Extension — OAuth + MFA + Passkey — completed 2026-05-22
- **phase-08** — Auth Foundation · Provider SDKs (firebase/supabase/testing/sdk-swap) — completed 2026-05-22
- **phase-09** — 로그인 UI + 수직 통합 슬라이스 — completed 2026-05-23
- [x] spec-x-governance-reset-package-layout (완료)
- [x] spec-x-nestjs-adapter-standard-module (완료)
- **phase-10** — Ops & Tooling — completed 2026-05-30
- [x] spec-x-secure-reset-token-logging (완료)
- **phase-11** — Observability + App Generator — completed 2026-05-30
- **phase-12** — Service Foundations I · Runtime — completed 2026-05-30
- **phase-13** — Service Foundations II · API & Data — completed 2026-05-31
- **phase-14** — Quality Hardening + CI/CD — completed 2026-06-01
- **phase-15** — Security & Wiring Hardening — completed 2026-06-02
- **phase-16** — Security Hardening II — completed 2026-06-02
- [x] spec-x-tenant-isolation-hardening (완료)
- **phase-17** — 멀티테넌시 Foundation + 이메일 어댑터 (Spine) — completed 2026-06-09
- **phase-18** — 인증 권위 모드 (Auth Authority Mode) — completed 2026-06-10
- [x] spec-x-web-consolidation (완료)
- [x] spec-x-design-md (완료)
- [x] spec-x-ui-tokens (완료)
- [x] spec-x-auth-screens (완료)
- [x] spec-x-console-shell (완료)
- [x] spec-x-org-api (완료)
- [x] spec-x-org-screens (완료)
- [x] spec-x-auth-token-refresh-interceptor (완료)
- **phase-19** — 계정 완성 + 인가 (Account + Authz) — completed 2026-06-13
- **phase-23** — ? — completed 2026-06-13
- **phase-20** — 데이터 UX — completed 2026-06-14
- **phase-21** — 어드민 + 빌링 — completed 2026-06-14
- **phase-22** — Deploy (k8s manifest 예제) — completed 2026-06-17
- [x] spec-x-ci-cache (완료)
- [x] spec-x-dev-rls-app-runtime (완료)
- [x] spec-x-ci-tooling-cleanup (완료)
- [x] spec-x-proactive-token-rotation (완료)
- [x] spec-x-docs-ssot (완료)
- [x] spec-x-docs-code-drift (완료)
- [x] spec-x-refactor-tidy (완료)
- **phase-23** — refactor-hardening — completed 2026-06-19
- **phase-24** — refactor-hardening-2 — completed 2026-06-23
- [x] spec-x-null-org-isolation-failclose (완료)
- [x] spec-x-org-members-defensive-scope (완료)
- [x] spec-x-list-query-bounds (완료)
- **phase-25** — refactor-hardening-3 — completed 2026-06-24
- [x] spec-x-web-drop-native-session-ui (완료)
<!-- sdd:done:end -->

---

## 📖 사용 방법

| 명령 | 동작 |
|---|---|
| `sdd phase new <slug>` | 새 Phase 생성 → 진행 중으로 등록 |
| `sdd phase new <slug> --base` | Phase base branch 모드로 생성 (opt-in) |
| `sdd spec new <slug>` | 진행 중 Phase에 다음 spec 등록 |
| `sdd plan accept` | spec Plan Accept → 실행 모드 진입 |
| `sdd ship` | spec 완료 처리 → Merged 갱신 + state 초기화 + NEXT 안내 |
| `sdd phase done <N>` | Phase 완료 → 완료 섹션으로 이동 |

자세한 사용법: `agent/constitution.md` §3 Work Type Model, `agent/agent.md`
