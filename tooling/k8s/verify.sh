#!/usr/bin/env bash
#
# tooling/k8s/verify.sh — 로컬 kind 클러스터에서 샘플 매니페스트 기동·헬스 검증.
#
#   bash tooling/k8s/verify.sh            # 클러스터 생성→빌드→load→apply→검증
#   bash tooling/k8s/verify.sh --cleanup  # 네임스페이스 + kind 클러스터 정리
#
# 전제: docker, kind, kubectl 설치.
# 이미지는 로컬 태그(service-foundry-{api,worker}:local)로 빌드 후 kind 노드에 load 한다.
# 운영 클러스터는 ghcr 이미지를 쓰고 이 스크립트 없이 `kubectl apply -f tooling/k8s/` 만 하면 된다.
set -euo pipefail

CLUSTER="service-foundry"
NS="service-foundry"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="$ROOT/tooling/k8s"
API_IMG="service-foundry-api:local"
WORKER_IMG="service-foundry-worker:local"

log() { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }

cleanup() {
  log "정리: 네임스페이스 + kind 클러스터 삭제"
  kubectl delete namespace "$NS" --ignore-not-found --wait=false || true
  kind delete cluster --name "$CLUSTER" || true
}

if [[ "${1:-}" == "--cleanup" ]]; then
  cleanup
  exit 0
fi

log "1) kind 클러스터 확인/생성: $CLUSTER"
if ! kind get clusters 2>/dev/null | grep -qx "$CLUSTER"; then
  kind create cluster --name "$CLUSTER"
fi

log "2) 이미지 빌드 (monorepo 루트 컨텍스트)"
docker build -f "$ROOT/apps/api/Dockerfile" -t "$API_IMG" "$ROOT"
docker build -f "$ROOT/apps/worker/Dockerfile" -t "$WORKER_IMG" "$ROOT"

log "3) kind 노드에 이미지 load"
kind load docker-image "$API_IMG" --name "$CLUSTER"
kind load docker-image "$WORKER_IMG" --name "$CLUSTER"

log "4) 매니페스트 적용 (namespace 먼저)"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR"

log "5) DB 마이그레이션 Job 완료 대기"
kubectl wait --for=condition=complete job/db-migrate -n "$NS" --timeout=300s

log "6) api / worker rollout 대기"
kubectl rollout status deploy/api -n "$NS" --timeout=300s
kubectl rollout status deploy/worker -n "$NS" --timeout=180s

log "7) api /health/ready 확인"
kubectl run healthcheck --rm -i --restart=Never -n "$NS" \
  --image=curlimages/curl:8.10.1 -- \
  curl -fsS "http://api:2026/health/ready"
echo

log "8) worker 기동 로그 확인"
kubectl logs deploy/worker -n "$NS" | grep -m1 "consumer started" || {
  echo "✗ worker consumer 로그 미확인"; exit 1;
}

log "✓ 검증 통과 — api readiness 200 + worker 기동 확인"
echo "정리하려면: bash tooling/k8s/verify.sh --cleanup"
