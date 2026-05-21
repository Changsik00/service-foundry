# Task List: spec-05-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + 패키지 scaffold

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-05-04-auth-password` (시작 지점: `phase-05-auth-core-security`)
- [ ] Commit: 없음

### 1-2. 패키지 디렉토리 + 메타 파일
- [ ] `packages/backend/auth-password/package.json`
- [ ] `tsconfig.json` / `vitest.config.ts` (auth-jwt 답습)
- [ ] `src/index.ts` placeholder
- [ ] `pnpm-workspace.yaml` 의 catalog 에 `argon2: ^0.44.0` 추가
- [ ] `pnpm install` — workspace 등록 + argon2 native binding 확인
- [ ] `pnpm --filter @repo/backend-auth-password typecheck` 통과
- [ ] Commit: `chore(spec-05-04): scaffold @repo/backend-auth-password 패키지`

---

## Task 2: `HashOptions` + `DEFAULT_OPTIONS` (TDD)

### 2-1. 테스트 작성 (Red)
- [ ] `src/options.test.ts` — DEFAULT_OPTIONS 값 (OWASP 2023) / merge 동작 (2 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-04): HashOptions 테스트 추가 — TDD Red`

### 2-2. 구현 (Green)
- [ ] `src/options.ts` — `HashOptions` interface + `DEFAULT_OPTIONS` const + `resolveOptions` helper
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-04): HashOptions + DEFAULT_OPTIONS (OWASP 2023)`

---

## Task 3: `hashPassword` (TDD)

### 3-1. 테스트 작성 (Red)
- [ ] `src/hash.test.ts` — PHC string shape / 같은 plain → 다른 hash / cost override / 빈 input 거부 (4 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-04): hashPassword 테스트 추가 — TDD Red`

### 3-2. 구현 (Green)
- [ ] `src/hash.ts` — argon2.hash + `type: argon2id` + cost merge
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-04): hashPassword — argon2id PHC string`

---

## Task 4: `verifyPassword` (TDD)

### 4-1. 테스트 작성 (Red)
- [ ] `src/verify.test.ts` — round-trip true / wrong password false / 빈 input false / malformed hash throw (4 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-04): verifyPassword 테스트 추가 — TDD Red`

### 4-2. 구현 (Green)
- [ ] `src/verify.ts` — argon2.verify + boolean 반환 + malformed throw 매핑 (`AppError` PASSWORD_HASH_MALFORMED)
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-04): verifyPassword — boolean 반환 + AppError 매핑`

---

## Task 5: `needsRehash` (TDD)

### 5-1. 테스트 작성 (Red)
- [ ] `src/rehash.test.ts` — 옛 cost (m=4096) true / 현 cost false / 명시 opts 비교 (3 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-04): needsRehash 테스트 추가 — TDD Red`

### 5-2. 구현 (Green)
- [ ] `src/rehash.ts` — argon2 의 `needsRehash` API 활용
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-04): needsRehash — cost 약화 감지`

---

## Task 6: README 작성

- [ ] `packages/backend/auth-password/README.md` — auth-jwt 답습. 사용 예제 (signup / signin / rehash) + 핵심 설계 결정 + Out of scope
- [ ] Commit: `docs(spec-05-04): auth-password README 작성`

---

## Task 7: 최종 검증

- [ ] `pnpm --filter @repo/backend-auth-password lint` 통과
- [ ] `pnpm --filter @repo/backend-auth-password typecheck` 통과
- [ ] `pnpm --filter @repo/backend-auth-password test` 전체 PASS
- [ ] 루트 `pnpm typecheck` 통과
- [ ] depcruise 그린
- [ ] Commit: 없음

---

## Task N: Ship

- [ ] 코드 품질 점검 재확인
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-05-04): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-05-04-auth-password`
- [ ] **PR 생성**: `/hk-pr-gh` (target: `phase-05-auth-core-security`)
- [ ] **사용자 알림**: PR URL 보고 + 머지 대기

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 + Ship |
| **예상 commit 수** | 13 (planning 1 + scaffold 1 + TDD red/green 4×2 + README 1 + ship 1) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 10:40 |
