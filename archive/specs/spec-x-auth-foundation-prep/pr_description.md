# docs(spec-x-auth-foundation-prep): Auth Foundation 결정 박기 + 9 phase 재조정 + 5 ADR + design note

## 📋 Summary

### 배경 및 목적

phase-02 (Shared Primitives) 완료 후 phase-03 (Backend Primitives) 진입 시도 시점에 **ADR-0005 / ADR-0006이 Deferred 상태로 phase-03을 블록**. 사용자가 두 차례 자문(1차 / 2차)을 통해 Auth Foundation 2차안(*Consistent Wrapped SDK*)을 채택 결정 + 본래 6 phase → 9 phase 재조정(옵션 A) 결정.

본 spec-x는 *순수 docs 작업*으로 결정을 *코드/문서로 박음*. **prototype 코드 0 / 회귀 0** — phase 진입 *전제* 작업.

### 주요 변경 사항

- [x] **ADR 5건**:
  - **ADR-0005** (보류 → **Accepted**) — NestJS + Drizzle (단일 ORM). Prisma 채택 ❌, memory 정정.
  - **ADR-0006** (보류 → **Accepted**) — Auth Platform 전략. "한 앱 한 Provider" + Consistent Wrapped SDK + Core Surface AuthSDK + AuthResult union (mfa_required 자리 잡기).
  - **ADR-0012** (신규) — Auth Error Normalize. `AuthErrorCode` 13개를 `@repo/errors` 도메인 코드로 흡수 (별 `auth-errors` 패키지 ❌). Provider Normalize Helper는 각 `auth-{provider}` 내부.
  - **ADR-0013** (신규) — Session Lifecycle. JWT EdDSA + Refresh rotation chain + **Reuse Detection (RFC 6819 필수)** + Key rotation 90일 + JWKS endpoint. `@repo/auth-session` 별 패키지.
  - **ADR-0014** (신규) — Security Baseline. CSRF (SameSite=Lax) + Rate limit (IP+account+progressive) + Account lockout + OAuth PKCE 강제 + argon2 + Cookie (httpOnly+Secure) + Step-up auth.
- [x] **design note** (`docs/notes/auth-foundation-architecture.md`, ~1000줄) — 2차안 본문 + ADR cross-ref 표 + phase 매핑 표
- [x] **9 phase 재조정** (`backlog/phase-{03~11}.md`):
  - phase-03 Backend Foundation (auth 제외) → phase-04 Frontend Foundation (auth 제외) → phase-05 Auth Core+Security → phase-06 Auth Integration → phase-07 Auth Extension (OAuth+MFA+Passkey) → phase-08 Provider Adapters → phase-09 Apps+Admin Tools → phase-10 Ops & Tooling (+ auth observability) → phase-11 CI/CD
- [x] **queue.md 갱신** — 대기 phase 9개로 갱신 + Icebox 정리
- [x] **memory 갱신** — `project_boilerplate_locked_stack` Prisma 제거 + `auth_foundation_architecture` 신규 + `MEMORY.md` index

### Phase 컨텍스트

- **Phase**: 없음 (Solo Spec — phase 외부)
- **본 SPEC-X의 역할**: phase-03 *블로커 해소* + auth foundation 결정을 *코드/문서로 박음*. 본 PR 머지 후 *phase-03 활성화 가능* + 후속 phase-05~10 spec 설계 시 *결정 자료 즉시 참조 가능*.

## 🎯 Key Review Points

1. **2차안 채택 근거**: 1차안의 *LCD 추상화*(단일 AuthProvider interface)는 *Provider 교체 가능*이라는 환상. 현실은 한 앱 한 Provider이며 Firebase custom claims / Supabase RLS 같은 *Provider 강점*이 LCD에서 죽음. 2차안 *Consistent Wrapped SDK*는 패키지 컨벤션 + Core Surface로 *runtime 추상화 없이* 일관성 달성. ADR-0006 §A.4 alternatives 참조.
2. **Drizzle 단일 결정 (memory 정정)**: 본래 `project_boilerplate_locked_stack` memory에 *Prisma+Drizzle 둘 다* 박혀있었으나, auth-session storage(`refreshTokenFamily` chain + Reuse Detection)의 SQL 정밀 제어 필요 + 두 ORM 운영 비용으로 **Drizzle 단일**. ADR-0005 §Rationale + memory 갱신 명시.
3. **5 ADR 분할 (단일 거대 ADR 회피)**: ADR-0006 단일에 박을 수도 있었으나, *각 ADR이 단일 책임 + 향후 갱신 단위 명확* 위해 4분할 (0006 전략 / 0012 error / 0013 session / 0014 security). ADR-0006이 *허브* — §A.3 Cross-ref 표로 연결.
4. **AuthResult union *처음부터* 박음**: ADR-0006 Decision 3 — `mfa_required` / `email_verification_required` 분기를 phase-05부터 type에 박음. MFA 구현은 phase-07이지만 *type breaking change 회피*. 후속 phase 진입 시 *interface migration 부담 0*.
5. **`auth-errors` 별 패키지 ❌**: 2차안에서는 *별 패키지* 제안했으나, ADR-0009 flat code 원칙 일관 위해 **`@repo/errors` 흡수**. `AuthErrorCode` 13개 + Provider Normalize Helper(각 `auth-{provider}` 내부). ADR-0012 §Decision 1.
6. **Refresh Token Reuse Detection 필수 (RFC 6819)**: 1차안 *"강력 추천"*에서 2차안 *"필수"*로 격상. 이거 없으면 rotation 의미 절반 사라짐. ADR-0013 §Decision 5.
7. **9 phase 야심 (옵션 A) 채택**: 본래 6 phase에서 *3 증가*. 옵션 B(Provider Adapters Icebox 8 phase) / C(Extension+Adapter Icebox 7 phase) 대신 *완전판*. Provider Adapters가 *Core Surface 컨벤션의 실증 단위*라 boilerplate 학습 가치. walkthrough §발견 사항 #3에 *spec 수 30+ 야심* 인지 명시.
8. **ADR 상단 Decision + 보류 본문 보존 패턴**: ADR-0005/0006의 *보류 분석 자료*(403/354줄)를 *전면 재작성* 대신 *상단에 §A Decision 섹션 추가 + 보류 본문 보존*. 분석 자료가 *결정 근거*로 가치 — 향후 ADR 갱신 패턴 답습 권장. walkthrough §발견 사항 #1.
9. **순수 docs spec-x — 회귀 0 ✅**: 코드 변경 0건이라 `pnpm lint` / `typecheck` / `test` 모두 FULL TURBO 그린. lefthook race fix(RCA-001)의 *typecheck glob 한정* 동작 검증 — 9 commit 모두 typecheck *trigger 안 됨* (`.md` 파일만 매칭).
10. **memory 갱신 부담 인지**: ADR 결정 시 *memory drift 위험* — 본 spec-x에서 T8 task에 *memory 갱신* 포함했으나 *자동 검출 메커니즘 부재*. Icebox 후보 (walkthrough §발견 사항 #5).

## 🧪 Verification

### 자동 테스트 (회귀 0 확인)

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
```

**결과 요약**:
- ✅ `pnpm lint`: FULL TURBO cache hit (5 패키지)
- ✅ `pnpm typecheck`: FULL TURBO cache hit (5 패키지)
- ✅ `pnpm test`: FULL TURBO cache hit (105 test from phase-02)
- ✅ lefthook 9 commit 모두 *biome (skip) + typecheck (skip)* — `.md` 파일만이라 glob 매칭 0

### 수동 검증

1. **ADR cross-ref 정합** ✅:
   ```bash
   grep -rE "ADR-001[234]" docs/adr/ docs/notes/ backlog/
   ```
   ADR-0012/13/14가 ADR-0006 §A.3에서 cross-ref + design note에서 표로 정리 + phase-05~08에서 Related 참조.

2. **phase-03 블로커 해소 확인** ✅:
   - 본래 phase-03.md *"ADR-0005 / 0006 결정 전까지 블록 상태"* 문구 → 제거됨
   - 새 phase-03.md *"Planning (진입 가능 — ADR-0005/0006 확정 완료)"*

3. **memory 정정** ✅:
   - `project_boilerplate_locked_stack` — Prisma+Drizzle → Drizzle 단일
   - `auth_foundation_architecture` — 신규 작성
   - `MEMORY.md` — index 갱신

4. **회귀 0 검증** ✅: 코드 변경 0건 → 회귀 위험 0.

## 📐 Architecture / Decision

- [x] **5 ADR**:
  - [docs/adr/0005-backend-framework-and-orm-strategy.md](../../docs/adr/0005-backend-framework-and-orm-strategy.md)
  - [docs/adr/0006-auth-strategy.md](../../docs/adr/0006-auth-strategy.md)
  - [docs/adr/0012-auth-error-normalize.md](../../docs/adr/0012-auth-error-normalize.md)
  - [docs/adr/0013-session-lifecycle.md](../../docs/adr/0013-session-lifecycle.md)
  - [docs/adr/0014-auth-security-baseline.md](../../docs/adr/0014-auth-security-baseline.md)
- [x] **design note**: [docs/notes/auth-foundation-architecture.md](../../docs/notes/auth-foundation-architecture.md)
- [x] **walkthrough.md** — 결정 기록 10건 + 사용자 협의 4건 + lefthook 검증 + 발견 사항 6건
- [x] **pr_description.md** — 본 문서

## 🚫 Out of Scope (의도적 deferral)

- **prototype 코드** — phase-03 첫 spec에서 NestJS hello world / Drizzle 연결 prototype 진행.
- **신규 패키지 scaffold** (auth-jwt / auth-session 등) — phase-05 진입 시 scaffold.
- **MFA / Passkey 구체 라이브러리 결정** (TOTP 라이브러리 / @simplewebauthn 버전 pin) — phase-07 진입 시.
- **Provider 라이브러리 버전 pin** (firebase-admin / supabase-js) — phase-08 진입 시.
- **OpenAPI / GraphQL contracts 변환** — phase-04 SDK 또는 phase-09.
- **memory ↔ ADR drift 검출 도구** — phase-10 tooling Icebox.
- **`@repo/auth-contracts` codegen** — phase-05 진입 시 결정.

## 🔗 Related

- **선행**:
  - phase-02 (`@repo/auth-contracts` 핵심 4 schema 박힘)
  - ADR-0008 (Result) / ADR-0009 (AppError flat code) / ADR-0010 (validation) — 본 ADR이 *확장 적용*
  - 사용자 자문 2차안 (2026-05-18) — design note의 *source*
- **후속**:
  - phase-03 활성화 (블로커 해소) — Backend Foundation
  - phase-04 Frontend Foundation
  - phase-05~08 Auth Foundation 본격 구현 (5 ADR + design note 참조)
  - phase-09~10 Apps + Admin + Ops
- **외부 표준**:
  - RFC 6819 — OAuth Threat Model (Reuse Detection)
  - RFC 9700 — OAuth 2.0 Security Best Current Practice (PKCE)
  - OWASP Authentication Cheat Sheet
- **코드/문서**:
  - [docs/notes/auth-foundation-architecture.md](../../docs/notes/auth-foundation-architecture.md)
  - [backlog/phase-03.md ~ phase-11.md](../../backlog/) (9 phase)
