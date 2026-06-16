# tooling/k8s — 샘플 Kubernetes 매니페스트

service-foundry 를 클러스터에서 띄우는 **최소 예제**다. 순수 YAML(헬름/커스터마이즈 없음)로
"무엇이 배포되는가"를 직독할 수 있게 했다. 로컬 [kind](https://kind.sigs.k8s.io/) 에서
기동·헬스까지 검증되며, 운영 클러스터로는 이미지·시크릿·스토리지만 교체하면 된다.

## 구성

| 파일 | 리소스 | 비고 |
|---|---|---|
| `namespace.yaml` | Namespace `service-foundry` | 한 번에 정리(`kubectl delete ns service-foundry`) |
| `config.yaml` | ConfigMap `app-config` | 비-민감 env (NODE_ENV, PORT=2026, REDIS host 등) |
| `secret.yaml` | Secret `app-secret` | ⚠️ 샘플 더미값 — **운영 교체 필수** |
| `postgres.yaml` | Deployment + Service + initdb ConfigMap | `emptyDir`(비영속). app_runtime role 생성 |
| `redis.yaml` | Deployment + Service | `emptyDir`(비영속) |
| `migrate-job.yaml` | Job `db-migrate` | `pnpm db:migrate`(슈퍼유저) — api 전에 1회 |
| `api.yaml` | Deployment + Service | `containerPort 2026`, liveness/readiness probe |
| `worker.yaml` | Deployment | redis 큐 consumer, HTTP/Service 없음 |
| `verify.sh` | — | 로컬 kind 검증 스크립트 |
| `__tests__/manifest-drift.test.ts` | — | api 포트 ↔ `apps/api/service.yaml` 정합 테스트 |

### 포트 SoT

`apps/api/service.yaml`(name=api, port=**2026**)가 서비스 포트의 SoT 다. `api.yaml` 의
containerPort/Service 포트가 이와 어긋나면 `manifest-drift.test.ts` 가 실패한다.

```bash
npx vitest run tooling/k8s      # 드리프트 테스트
pnpm tooling:manifest           # service.yaml 자체 검증
```

### 런타임 role 과 RLS (중요)

api 런타임 접속(`DATABASE_URL`)은 **비-슈퍼유저** `app_runtime` role 을 쓴다 — 슈퍼유저는
RLS 테넌트 격리를 우회하기 때문(spec-17-07). 마이그레이션만 슈퍼유저
(`DATABASE_MIGRATE_URL`)로 실행해 `app_runtime` 에 GRANT 를 적용한다. `NODE_ENV=production`
이라 약한 시크릿·슈퍼유저 런타임이면 기동이 거부된다(spec-16-02).

## 로컬 검증 (kind)

```bash
bash tooling/k8s/verify.sh            # 클러스터 생성 → 이미지 빌드 → load → apply → 헬스 검증
bash tooling/k8s/verify.sh --cleanup  # 네임스페이스 + 클러스터 정리
```

수동으로 하려면:

```bash
kind create cluster --name service-foundry
docker build -f apps/api/Dockerfile    -t service-foundry-api:local .
docker build -f apps/worker/Dockerfile -t service-foundry-worker:local .
kind load docker-image service-foundry-api:local service-foundry-worker:local --name service-foundry
kubectl apply -f tooling/k8s/namespace.yaml
kubectl apply -f tooling/k8s/
kubectl wait --for=condition=complete job/db-migrate -n service-foundry --timeout=300s
kubectl rollout status deploy/api -n service-foundry
kubectl port-forward -n service-foundry svc/api 2026:2026 &
curl -fsS http://localhost:2026/health/ready
```

## 운영 클러스터로 확장

이 디렉토리는 *예제* 다. 운영 적용 시 최소한 다음을 교체/추가한다.

- **이미지**: `service-foundry-{api,worker}:local` → `ghcr.io/<org>/service-foundry-{api,worker}:<tag>`
  (phase-14 docker publish 산출). `imagePullPolicy` 와 `imagePullSecrets` 설정.
- **시크릿**: `secret.yaml` 더미값 제거 → External Secrets Operator / SOPS / sealed-secrets /
  `kubectl create secret` 로 주입.
- **스토리지**: postgres/redis `emptyDir` → StatefulSet + PVC, 또는 관리형(RDS/ElastiCache).
- **노출**: api `Service`(ClusterIP) 앞에 Ingress + TLS.
- **확장/복원력**: HPA, PodDisruptionBudget, resource requests/limits, NetworkPolicy.
- **관측성**: ServiceMonitor / OTEL collector (관련 설정은 `tooling/docker/observability`).

> 본 샘플은 의도적으로 위 항목을 제외해 "코어가 어떻게 뜨는가"에 집중한다. 필요 시 후속 spec 으로 추가.
