# Task List: spec-22-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 인프라 매니페스트 (postgres / redis / config / secret)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-22-01-k8s-manifest-example`

### 1-2. 구현
- [x] `tooling/k8s/namespace.yaml` — `service-foundry` Namespace
- [x] `tooling/k8s/config.yaml` — ConfigMap (NODE_ENV=production, PORT=2026, REDIS host·port, HTTP_CLIENT_BASE_URL 등 비-민감 env)
- [x] `tooling/k8s/secret.yaml` — Secret (dev 샘플값 + "운영 교체 필수" 경고 주석, production 가드 통과 강한 시크릿)
- [x] `tooling/k8s/postgres.yaml` — Deployment(`postgres:16-alpine`, emptyDir, initdb app_runtime role) + ClusterIP Service(5432) + readiness(`pg_isready`)
- [x] `tooling/k8s/redis.yaml` — Deployment(`redis:7-alpine`) + ClusterIP Service(6379) + readiness(`redis-cli ping`)
- [x] kubectl `--dry-run=client` 검증 통과
- [x] Commit: `feat(spec-22-01): add k8s infra manifests (postgres/redis/config/secret)`

---

## Task 2: 앱 매니페스트 + 드리프트 테스트 (TDD)

### 2-1. 테스트 작성 (TDD Red)
- [x] 드리프트 테스트 작성: `tooling/k8s/__tests__/manifest-drift.test.ts`
- [x] 테스트 실행 → Fail 확인 (api.yaml 미존재, ENOENT)
- [x] Commit: `test(spec-22-01): add k8s api manifest drift test`

### 2-2. 구현 (TDD Green)
- [ ] `tooling/k8s/api.yaml` — Deployment(`containerPort: 2026`, liveness `/health/live`·readiness `/health/ready`, postgres 대기 initContainer, env from Config/Secret) + ClusterIP Service(2026)
- [ ] `tooling/k8s/worker.yaml` — Deployment(redis env, Service 없음)
- [ ] `tooling/k8s/migrate-job.yaml` — `pnpm db:migrate` Job (postgres 대기 initContainer)
- [ ] 드리프트 테스트 + `pnpm tooling:manifest` 실행 → Pass 확인
- [ ] Commit: `feat(spec-22-01): add api/worker/migrate k8s manifests`

---

## Task 3: 로컬 kind 검증 스크립트 + 실행

### 3-1. 구현
- [ ] `tooling/k8s/verify.sh` — kind 생성 → 이미지 빌드 → `kind load` → `kubectl apply` → migrate Job 대기 → api `/health/ready` 확인 → worker 로그 확인 (`--cleanup` 옵션 포함)
- [ ] Commit: `feat(spec-22-01): add kind verification script`

### 3-2. 검증 실행 (증빙 수집)
- [ ] `bash tooling/k8s/verify.sh` 실행 → api `/health/ready` 200 + worker 기동 로그 확인
- [ ] (DB 거동에 따라 initContainer/Job 전략 보정 — 필요 시 Task 2 매니페스트 수정 후 재커밋)
- [ ] 증빙 캡처 → walkthrough 첨부용 보관

---

## Task 4: README

### 4-1. 작성
- [ ] `tooling/k8s/README.md` — 구조 · 검증 절차 · 운영 확장(ghcr 이미지 교체, Secret 관리, PVC, Ingress/HPA) 가이드
- [ ] Commit: `docs(spec-22-01): add tooling/k8s README`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] **전체 테스트 실행** → 모두 PASS (`pnpm vitest run` 관련 범위 + `pnpm tooling:manifest`)

### 📝 산출물 작성
- [ ] **walkthrough.md 작성** (kind 검증 증빙 포함)
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-22-01): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-22-01-k8s-manifest-example`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
