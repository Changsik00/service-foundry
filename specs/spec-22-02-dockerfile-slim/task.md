# Task List: spec-22-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

> ⚠️ **WIP (draft)** — 2026-06-16 Docker 데몬 과부하로 중단. 구현(deps 이동 + Dockerfile deploy --prod)은 작성 완료했으나
> **이미지 빌드 크기 측정 + k8s 통합검증(verify.sh) 미수행**. Docker 재시작 후 재개 필요.
> 검증된 사실: `pnpm deploy --prod` 로 store 826M→642M 감소. `next` 는 `@env-kit/node-settings` 직접 의존으로 잔존(별도 정리).

---

## Task 0: 브랜치 생성
- [x] `git checkout -b spec-22-02-dockerfile-slim` (base: phase-22-deploy)

---

## Task 1: api Dockerfile 멀티스테이지 전환

### 1-1. 구현
- [x] `apps/api/Dockerfile` → build(`pnpm deploy --prod --legacy`)/runner 멀티스테이지 (turbo prune→deploy 로 전환)
- [x] tsx·drizzle-kit 런타임 deps 이동 (migrate Job 도 이 이미지 사용 → drizzle-kit 필요), root tsconfig runner 복사
- [x] Commit: `refactor(spec-22-02): multi-stage api Dockerfile via pnpm deploy --prod`

### 1-2. 검증 (⚠️ 미완 — Docker 중단)
- [ ] `docker build` 성공 + `docker images` 크기 측정
- [ ] frontend/devDep 부재 확인 (next 잔존은 별도 사안)

---

## Task 2: worker Dockerfile 멀티스테이지 전환

### 2-1. 구현
- [x] `apps/worker/Dockerfile` → 동일 패턴(`pnpm deploy --prod --legacy`)
- [x] Commit: `refactor(spec-22-02): multi-stage worker Dockerfile via pnpm deploy --prod`

### 2-2. 검증 (⚠️ 미완 — Docker 중단)
- [ ] `docker build` 성공 + 크기 감소 측정

---

## Task 3: k8s 통합 검증 (기능 동등성)

- [ ] `bash tooling/k8s/verify.sh` → api `/health/ready` 200 + worker 기동 (슬림 이미지)
- [ ] 크기/빌드 증빙 캡처 (walkthrough 첨부)

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck` PASS (Dockerfile 변경이라 코드 영향 없음 확인)

### 📝 산출물 작성
- [ ] **walkthrough.md 작성** (크기 비교 + verify 증빙)
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-22-02): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-22-02-dockerfile-slim`
- [ ] PR 생성 → base `phase-22-deploy`
