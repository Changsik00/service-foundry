# phase-17 비판적 회고 (독립 감사 + 오케스트레이터 검증)

> 2026-06-08. 독립 Opus 서브에이전트 회고 → 메인 세션이 코드로 직접 검증. **결론: 🔴 NO-GO** — 선언된 테넌트 격리 spine 이 실제 HTTP 요청 경로에서 작동하지 않음. phase-ship PR(#118) 머지 보류 권고.

## 🔴 Critical (검증 완료 — phase merge 전 필수 수정)

| # | 문제 | 증거 (검증됨) | 영향 |
|---|---|---|---|
| C-1 | **JWT 클레임명 불일치 → 요청 경로 RLS 전면 무력화** | 서명=`activeOrgId`(`signup.service.ts:36`, `org-switch.service.ts:31`) / 가드 읽기=`result.value.orgId`(`auth.guard.ts:59`). 매핑 코드 부재 → `req.user.orgId` 항상 null → `tenant.interceptor.ts:34` 가 tx 미개시 → `set_config` 미발행 → RLS 무컨텍스트(전체 허용) | 성공 기준 3·4 실질 미달. 격리 0 |
| C-2 | **signin/refresh 토큰에 org 클레임 없음** | `signin.service.ts:73,92` = `{sub, role}` 만. signup 만 org 포함 | 로그인 사용자는 영구 무컨텍스트 |
| C-3 | **org_id 미백필 + write 경로 미설정** | `0010_org_id_columns.sql` = nullable·DEFAULT 없음·FK(users 만). `auth-session/schema.ts:18`·`auth-rate-limit/schema.ts:18,39` orgId nullable, 생성 경로 미설정 → 전부 NULL | 격리 활성화 시 세션·rate-limit 조회 회귀(NULL row 가 모든 org 에서 안 보임) |
| C-4 | **cross-org invite accept 가 격리 하에서 파손** | `org-invite.service.ts:72-75` invitations SELECT 가 컨텍스트 종속. 수락자 컨텍스트≠초대 org → RLS 가 가려 항상 NotFound | 격리 ON 과 초대 기능 상호 배타 |
| C-5 | **초대 토큰-이메일 바인딩 부재 (인가 우회)** | `org-invite.service.ts:70-85` — `invitation.email` 과 수락자 email 비교 없음. membership 중복 가드 없음 | 토큰 입수자가 임의 org 침투/권한 획득 |

## 🟡 Warning

- W-1 invite accept 비원자성(`org-invite.service.ts:81-90`, tx 없음)
- W-2 쓰기 강제 미구현(`WITH CHECK(true)`, 의도적 — phase-19 전 처리)
- W-3 약속한 ADR `tenant-isolation-runtime-role-and-als-tx` 미작성
- W-4 요청-스코프 tx 동시성 한계(풀=동시 인증요청), pgbouncer 부재
- W-5 production 슈퍼유저 가드가 `username==="postgres"` 단일 관례명만 검사(`settings.ts:76`) — BYPASSRLS/타 슈퍼유저 우회
- W-6 이메일 실전송 미검증(전부 mock)

## 📊 목표 달성도 (정정)

| # | 성공 기준 | 결과 | 비고 |
|---|---|:---:|---|
| 1 | 이메일 실발송 | 🟡 배선만 | 실발송 검증 없음 |
| 2 | signup → org+membership | 🟢 | provision tx 충족 |
| 3 | RLS DB-level 격리 | 🔴 **미달** | DB-level raw SQL 만 동작, 실 요청 경로는 C-1/C-2 로 무격리. e2e 가 경로 우회한 거짓 GREEN |
| 4 | org switch 클레임 변경 | 🔴 **미검증·미달** | 테스트가 truthy 만 확인, 가드가 클레임 무시 |
| 5 | 기존 e2e GREEN | 🟢(형식) | GREEN 의 원인이 "격리가 안 켜져서" — 통과와 보안이 상호 배타 |

## 🧪 근본 원인: 거짓 GREEN 구조

`tenant-isolation.e2e.test.ts` 는 raw `pg` client 로 직접 `set_config` 후 조회 — **guard·interceptor·proxy·JWT 어느 것도 안 거침**. 따라서 실 요청 경로의 C-1/C-2 를 구조적으로 검출 불가. interceptor 테스트는 `req.user.orgId` 를 직접 주입해 가드 결함 우회. auth.e2e 는 org assertion 0건. → **메커니즘은 검증했으나 배선은 검증 안 함.** self-review blind spot 의 전형.

## ✅ 잘한 것 (Keep)
- 하이브리드 role 분리 + production 가드 컨셉, NULLIF GUC 수정, migrate/runtime URL 분리 — DB 층은 견고
- ALS+요청스코프 tx 설계 아이디어(배선만 누락)

## 🛠 수정 계획 → spec-17-08 (격리 실효화 II)
1. **C-1**: 가드가 `activeOrgId` 읽도록(또는 클레임 상수 단일화) — `req.user.orgId ← activeOrgId`
2. **C-2**: signin/refresh 에 active_org 클레임 주입(사용자의 현재/기본 org)
3. **C-3**: 기존 테이블 org_id 백필 + write 경로 설정(또는 격리 활성화 회귀 차단책)
4. **C-4**: invite accept 등 정당한 cross-org 읽기/쓰기에 context 승격 seam
5. **C-5**: 토큰-이메일 바인딩 + membership 중복 가드 + accept 원자화(W-1)
6. **회귀 가드**: 실 HTTP(supertest)→실 토큰→guard→interceptor→RLS 차단 통합 테스트 + "무컨텍스트로 새면 실패"하는 음성 테스트
7. W-3 ADR 작성

## 🤖 go/no-go: 🔴 NO-GO (PR #118 머지 보류)
격리 spine 이 실 경로에서 미작동. C-1~C-5 수정 + 실 HTTP 통합 테스트 후 재-ship 권고. 현재 "GREEN"과 "격리"는 상호 배타 상태.
