# Task List: spec-02-04

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] phase-02.md SPEC 표 자동 갱신
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + phase-02.md 정정

- [x] `git checkout -b spec-02-04-shared-contracts`
- [x] phase-02.md: §spec-02-05 정의 *제거* + 결정 기록에 "spec-02-05를 spec-02-04에 흡수 (2026-05-18) — ADR-0006 보류 + ceremony 절감" + Phase Done 조건 spec-02-01 ~ spec-02-04로 정리
- [x] 통합 테스트 시나리오의 spec-02-05 참조 정리 + 위험 표 정정 + 성공 기준 #4 정정
- [x] Commit: `chore(spec-02-04): absorb spec-02-05 into spec-02-04 (phase-02.md cleanup)`

---

## Task 2: `@repo/contracts` scaffold + `UserProfile` + 첫 test

- [x] `packages/shared/contracts/` 디렉토리 + scaffold (package.json / tsconfig.json (DOM lib) / vitest.config.ts).
- [x] `package.json`: deps `@repo/validation: workspace:*` + `zod: catalog:`. exports에 `.` + `./user` + `./pagination` sub-path.
- [x] `pnpm install` → lockfile 갱신.
- [x] `src/user.ts`: `UserProfile` schema (id: Uuid / email: Email / displayName / createdAt).
- [x] `src/index.ts`: `export * from "./user.js"`.
- [x] `src/user.test.ts`: `describe("UserProfile")` 3 test (valid / invalid email / 짧은 displayName).
- [x] test → Pass (3/3).
- [x] Commit: `feat(spec-02-04): scaffold @repo/contracts with UserProfile schema`

---

## Task 3: `paginatedResponse<T>` helper

- [ ] `src/pagination.test.ts`: `describe("paginatedResponse")` 3 test:
  - 응답 구조 valid (items + page + perPage + total)
  - item schema 위반 거부
  - 음수 total 거부
- [ ] test → Fail.
- [ ] `src/pagination.ts`: `paginatedResponse<T>(itemSchema)` 구현.
- [ ] `src/index.ts`에 re-export 추가.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-04): add paginatedResponse helper`

---

## Task 4: `@repo/auth-contracts` scaffold + 4 schema + test

- [ ] `packages/shared/auth-contracts/` 디렉토리 + scaffold (동일 패턴).
- [ ] `package.json`: deps `@repo/validation` + `zod`. exports `.` only.
- [ ] `pnpm install` → lockfile 갱신.
- [ ] `src/index.test.ts`: 4 schema × 1~2 test = 4~6 test:
  - `Role`: 유효값 통과 / 잘못된 값 거부
  - `User`: valid 통과 / email 위반 거부
  - `Session`: valid 통과
  - `JwtPayload`: valid 통과 / 음수 iat 거부 (z.number().int 위반 아님 — int만 검증, 음수도 통과? 확인 필요)
- [ ] test → Fail.
- [ ] `src/index.ts`: `Role` / `User` / `Session` / `JwtPayload` schema + type export.
- [ ] test → Pass.
- [ ] Commit: `feat(spec-02-04): add @repo/auth-contracts with core 4 schemas (Role/User/Session/JwtPayload)`

---

## Task 5: ADR-0011 + depcruise 검증

- [ ] `docs/adr/0011-contracts-package-layout.md` 작성:
  - frontmatter `type: convention`, status: accepted
  - Context: ADR-0003 §6 후속, spec-02-05 흡수, ADR-0006 보류 영향
  - Decision: 5~6개 (두 패키지 분리 유지 / sub-path export 컨벤션 / `paginatedResponse` 패턴 / 핵심 schema 위주 / 호스팅 앱의 자체 schema 패키지 가이드 / spec-02-05 흡수 기록)
  - Consequences (긍정/부정)
  - Alternatives: 단일 contracts 통합 / OpenAPI codegen 우선 / valibot / Prisma → zod 변환
  - Status: accepted (2026-05-18)
  - Related: ADR-0003 / 0006 / 0008 / 0009 / 0010, 후속 Phase 3/4
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → violation 0건.
- [ ] `wc -l packages/shared/{contracts,auth-contracts}/src/*.ts`.
- [ ] Commit: `docs(spec-02-04): add ADR-0011 contracts-package-layout`

---

## Task 6: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린 (lefthook race fix 재검증).
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 + spec-02-05 흡수 효과 + lefthook race 재발 여부 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-02-04-shared-contracts`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치+phase정정 + T2 contracts/UserProfile + T3 paginatedResponse + T4 auth-contracts + T5 ADR + T6 ship) |
| **예상 commit 수** | 5 (T6 ship 자동 commit 포함 시 6) |
| **예상 test 수** | ~10 (UserProfile 3 + paginatedResponse 3 + auth-contracts 4~6) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-18 |
