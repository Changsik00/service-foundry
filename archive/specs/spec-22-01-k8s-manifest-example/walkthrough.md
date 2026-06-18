# Walkthrough: spec-22-01

> k8s 샘플 매니페스트 + 로컬 kind 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 매니페스트 형식 | 순수 YAML / kustomize / helm | **순수 YAML** | 예제 가독성 — "무엇이 배포되는가" 직독 (phase-22 결정) |
| 이미지 참조 | 로컬 태그 / ghcr 하드코딩 | **로컬 태그 `:local` + `kind load`** | 로컬 검증 단순화, 정체불명 org 회피. 운영 ghcr 교체는 README 안내 |
| 런타임 모드 | staging(가드 우회) / production | **NODE_ENV=production + app_runtime role** | 슈퍼유저 런타임은 RLS 격리 우회 — 샘플도 안전 경로를 보여야 함 (spec-17-07, spec-16-02) |
| DB 준비 | 앱이 직접 대기 / migrate Job + initContainer | **migrate Job(슈퍼유저) + wait-for-postgres initContainer** | 스키마·GRANT 보장 후 api 기동, 크래시 루프 방지 |
| 영속성 | PVC / emptyDir | **emptyDir(샘플)** | 예제는 비영속으로 단순화, 운영 PVC 는 README 안내 |

<!-- ADR 미승격: 경량 결정 — phase-22.md 결정 기록 + 본 표로 충분. 후속 helm/kustomize 도입 시 ADR 검토. -->

## 💬 사용자 협의

- **주제**: 작업 모드 / phase 구조
  - **합의**: turbo 유지 + phase-22 정식 진입(non-base, 단일 spec)
- **주제**: 이미지 참조 전략 (저위험 갈림길)
  - **합의**: 터보에서 저위험 결정은 에이전트가 직접 판단 — Option 1(로컬 태그) 채택, 이후 유사 결정도 위임

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `npx vitest run tooling/k8s` · `pnpm tooling:manifest` · `kubectl apply --dry-run=client`
- **결과**: ✅ Passed
```text
# 드리프트 테스트
Test Files  1 passed (1) / Tests  4 passed (4)
# service manifest 검증기
✓ service manifest 2건 검증 통과
# kubectl client dry-run — 8 리소스 valid
```

### 통합 검증 (로컬 kind)
- **명령**: `bash tooling/k8s/verify.sh`
- **결과**: ✅ Passed
```text
▶ 5) job.batch/db-migrate condition met
▶ 6) deployment "api" successfully rolled out
       deployment "worker" successfully rolled out
▶ 7) api /health/ready → {"status":"ready"}
▶ 8) [worker] consumer started (queue=default, redis=redis:6379)
✓ 검증 통과 — api readiness 200 + worker 기동 확인
```

### 수동 검증
1. **Action**: kind 클러스터에 매니페스트 apply → migrate Job 완료 대기 → api rollout
   - **Result**: api `/health/ready` 200 `{status:"ready"}`, worker consumer 기동
2. **Action**: `bash tooling/k8s/verify.sh --cleanup`
   - **Result**: 네임스페이스 + kind 클러스터 정상 정리

## 🔍 발견 사항

- 성공 기준 #2(health green) 에는 마이그레이션이 필수는 아님(readiness=lifecycle 기반). 그러나 app_runtime role 존재 + DB 연결성은 필요 → initdb role 스크립트 + wait-for-postgres initContainer 로 충족.
- `apps/api/Dockerfile` 의 `EXPOSE 3000` 은 문서용일 뿐 실제 리슨 포트는 `PORT` env(=2026). 매니페스트는 service.yaml SoT(2026)에 정렬.
- tooling/ 은 워크스페이스 패키지가 아니라 `turbo run test` 가 드리프트 테스트를 수집하지 않음 → `npx vitest run tooling/k8s` 로 실행. CI 자동화는 이월 항목.

## 🚧 이월 항목

- 드리프트 테스트 CI 자동화 (tooling 테스트가 `turbo run test` 에 안 잡힘) → `backlog/queue.md` Icebox 후보.
- helm/kustomize overlay, Ingress/TLS/HPA/PVC 운영 리소스 → README 확장 포인트로 명시, 필요 시 후속 spec.
