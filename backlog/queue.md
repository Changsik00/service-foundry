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
- [ ] ARCHITECTURE.md 본체 재작성 (Phase 3 직전, ADR-0005 결정 후)

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
