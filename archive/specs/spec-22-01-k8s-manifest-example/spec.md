# spec-22-01: k8s 샘플 매니페스트 + 로컬 클러스터 검증

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-22-01` |
| **Phase** | `phase-22` |
| **Branch** | `spec-22-01-k8s-manifest-example` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-06-16 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

- `tooling/docker/compose.yaml` 은 **인프라(postgres / redis / observability)만** 컨테이너로 띄운다. `apps/api` · `apps/worker` 는 로컬에서 `pnpm` 으로 직접 실행되며 컨테이너 오케스트레이션 예제가 없다.
- `apps/api/Dockerfile` · `apps/worker/Dockerfile` 은 존재(phase-10/14) → 이미지화는 가능하나, "클러스터에서 어떻게 띄우는가" 의 본보기가 없다.
- `apps/api/service.yaml`(name=api, port=**2026**, expose=true) 가 서비스 매니페스트 SoT 이고 `tooling/scripts/manifest` 검증기가 이를 검증한다. k8s 매니페스트는 이 SoT 와 **port/name 이 일치**해야 한다(드리프트 방지).

### 문제점

service-foundry 가 "로컬뿐 아니라 클러스터에서도 돌릴 수 있는" 보일러플레이트가 되려면 apps/api · worker · postgres · redis 의 **샘플 k8s 매니페스트**와, 로컬 클러스터(kind)에서 기동·헬스까지 확인하는 **검증 경로**가 있어야 한다.

### 해결 방안

`tooling/k8s/` 에 순수 YAML 로 4개 워크로드(postgres / redis / api / worker)의 최소 매니페스트(Deployment/Service/ConfigMap/Secret)를 제공하고, 로컬 kind 클러스터에 apply → `/health/ready` 200 · worker 기동 로그까지 확인하는 `verify.sh` 와 README 를 둔다. k8s api 매니페스트의 포트가 `apps/api/service.yaml` 과 어긋나지 않는지 보장하는 **드리프트 테스트**를 추가한다.

## 요구사항

1. `tooling/k8s/` 에 postgres · redis · api · worker 매니페스트 존재 (Deployment + 필요한 Service + ConfigMap + Secret 예시).
2. 비밀이 아닌 설정은 **ConfigMap**, 비밀(JWT/쿠키/CSRF/DB 비밀번호 등)은 **Secret** 으로 분리. Secret 은 *dev 샘플값 + 운영 교체 경고* 를 명시.
3. api Deployment 는 `/health/live`(liveness) · `/health/ready`(readiness) probe 를 배선하고 `containerPort: 2026` 으로 노출. Service(ClusterIP) 가 이를 가리킨다.
4. worker Deployment 는 HTTP 없음(Service 없음), redis 연결 env 만 주입.
5. DB 의존: postgres 기동 후 api 가 정상 기동하도록 **마이그레이션 Job + readiness 대기**(initContainer) 경로 제공.
6. **드리프트 테스트**: k8s api 매니페스트의 containerPort/Service targetPort 와 name 라벨이 `apps/api/service.yaml`(port=2026, name=api)과 일치함을 검증하는 테스트 추가 (vitest).
7. 로컬 kind 클러스터에서 `verify.sh` 실행 → api `/health/ready` 200 + worker 기동 로그 확인. 증빙을 walkthrough 에 첨부.
8. `tooling/k8s/README.md` — 빌드/로드/적용/검증 절차 + 운영 클러스터로의 확장(이미지 ghcr 교체, Secret 관리, PVC) 가이드.

## Out of Scope

- helm chart / kustomize overlay (결정: 우선 순수 YAML — phase-22.md 결정 기록). 필요 시 후속 spec.
- Ingress / TLS / HPA / NetworkPolicy / ServiceMonitor 등 운영 고급 리소스 (README 에 확장 포인트만 언급).
- 실제 ghcr 이미지 게시·풀 (phase-14 docker publish 소관). 로컬 검증은 로컬 빌드 이미지 + `kind load` 사용.
- postgres 영속화(PVC)·HA — 샘플은 `emptyDir`(ephemeral). README 에 운영 시 PVC 안내.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **이미지 참조 전략**: 샘플 매니페스트의 `image:` 를 (A) 로컬 태그 `service-foundry-api:local` + `imagePullPolicy: IfNotPresent`(kind load 전제) 로 둘지, (B) `ghcr.io/<org>/service-foundry-api:latest` 로 두고 verify.sh 가 로컬 빌드분을 해당 태그로 로드할지. **권장: A** — 로컬 검증이 단순하고, README 에서 운영용 ghcr 교체를 1줄로 안내. 정체불명 org 하드코딩 회피.

> [!WARNING]
> - [ ] api 가 DB 연결 실패 시 크래시 루프에 빠지는지 여부에 따라 마이그레이션/대기 전략(initContainer)이 필수일 수 있음 — verify 단계에서 실제 거동 확인 후 확정.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **매니페스트 형식** | 순수 YAML, 워크로드별 1파일 | 예제 가독성 — helm/kustomize 추상화 없이 "무엇이 배포되는가" 직독 (phase-22 결정) |
| **네임스페이스** | `service-foundry` 전용 ns | 격리 + 한 번에 `kubectl delete ns` 정리 |
| **설정/비밀 분리** | ConfigMap(평문 env) + Secret(민감값) | 12factor, 운영 교체 지점 명확화 |
| **api 포트** | `containerPort: 2026`, `PORT=2026` env | `apps/api/service.yaml`(SoT) 와 정합 — 드리프트 테스트로 강제 |
| **DB 준비** | migrate Job + initContainer(`pg_isready`/migrate 대기) | api 기동 전 스키마 보장, 크래시 루프 방지 |
| **이미지** | 로컬 태그 + `kind load`(권장안 A) | 로컬 검증 단순화, 운영은 README 의 ghcr 교체 |
| **검증** | `verify.sh`(kind 생성→빌드→load→apply→probe) | 성공 기준 #2 재현 가능, CI 외 수동 실행 전제 |

## Proposed Changes

#### [NEW] `tooling/k8s/namespace.yaml`
`service-foundry` Namespace.

#### [NEW] `tooling/k8s/config.yaml`
ConfigMap — NODE_ENV, PORT=2026, DATABASE host/port/name, REDIS host/port, FRONTEND_URL 등 비-민감 env.

#### [NEW] `tooling/k8s/secret.yaml`
Secret(`stringData`) — dev 샘플: POSTGRES_PASSWORD, JWT/쿠키/CSRF secret 등. 상단에 "운영 교체 필수" 경고 주석.

#### [NEW] `tooling/k8s/postgres.yaml`
Deployment(`postgres:16-alpine`, env from Secret/Config, `emptyDir`) + ClusterIP Service(5432) + readiness(`pg_isready`).

#### [NEW] `tooling/k8s/redis.yaml`
Deployment(`redis:7-alpine`) + ClusterIP Service(6379) + readiness(`redis-cli ping`).

#### [NEW] `tooling/k8s/migrate-job.yaml`
Job — api 이미지로 `pnpm db:migrate` 1회 실행 (postgres 준비 대기 initContainer 포함).

#### [NEW] `tooling/k8s/api.yaml`
Deployment(api 이미지, env from Config/Secret, `containerPort: 2026`, liveness `/health/live`·readiness `/health/ready`, postgres 대기 initContainer) + ClusterIP Service(2026).

#### [NEW] `tooling/k8s/worker.yaml`
Deployment(worker 이미지, redis env). Service 없음.

#### [NEW] `tooling/k8s/verify.sh`
kind 클러스터 생성 → api/worker 이미지 빌드 → `kind load` → `kubectl apply -f tooling/k8s/` → migrate Job 완료 대기 → api rollout/`/health/ready` 확인 → worker 로그 확인. 멱등·정리(`--cleanup`) 옵션.

#### [NEW] `tooling/k8s/__tests__/manifest-drift.test.ts` (또는 `tooling/scripts` 하위)
k8s api 매니페스트 파싱 → containerPort·Service targetPort·name 라벨이 `apps/api/service.yaml`(port=2026, name=api)과 일치 검증.

#### [NEW] `tooling/k8s/README.md`
구조·검증 절차·운영 확장(ghcr 이미지 교체, Secret 관리, PVC, Ingress/HPA) 가이드.

## 검증 계획

```bash
# 1) 드리프트 테스트 (단위)
pnpm vitest run tooling/k8s   # 또는 해당 테스트 경로

# 2) 로컬 kind 통합 검증
bash tooling/k8s/verify.sh

# 3) 매니페스트 SoT 검증기 정합 (기존)
pnpm tooling:manifest
```

수동 검증 시나리오:
1. `verify.sh` 실행 → kind 노드에 이미지 load, `kubectl apply` 성공 — 기대: 모든 워크로드 생성.
2. migrate Job `Complete` → api Deployment `Available` → `kubectl exec`/port-forward 로 `GET /health/ready` → **200 `{status:"ready"}`**.
3. `kubectl logs deploy/worker` → `[worker] consumer started` 로그 확인.

## ADR 후보

- [x] ADR 가치 있는 결정 있음 → 후보: `k8s-sample-manifest-plain-yaml` (type: tradeoff) — 순수 YAML vs helm/kustomize, 로컬 태그 vs ghcr. *경량 결정이면 phase-22.md 결정 기록으로 충분* — 작성 시점에 재판단.
- [ ] 없음

## ✅ Definition of Done

- [ ] 드리프트 테스트 PASS + `pnpm tooling:manifest` PASS
- [ ] `verify.sh` 로 kind 기동 → api `/health/ready` 200 + worker 기동 로그 확인 (증빙 walkthrough 첨부)
- [ ] `tooling/k8s/README.md` 작성
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-22-01-k8s-manifest-example` 브랜치 push 완료
