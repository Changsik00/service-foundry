# feat(spec-22-01): add k8s sample manifests with local kind verification

## 📋 Summary

### 배경 및 목적

service-foundry 는 로컬 인프라(compose)만 컨테이너화돼 있고 apps/api·worker 의 클러스터 배포 예제가 없었다. 본 SPEC 은 `tooling/k8s/` 에 순수 YAML 샘플 매니페스트(postgres/redis/api/worker)와 로컬 kind 검증 경로를 제공해, 보일러플레이트가 "클러스터에서도 뜬다"는 것을 재현 가능하게 만든다.

### 주요 변경 사항
- [x] `tooling/k8s/` 에 4개 워크로드 매니페스트 + ConfigMap/Secret + 마이그레이션 Job
- [x] api: `containerPort 2026`(service.yaml SoT 정합) + liveness/readiness probe
- [x] 런타임은 비-슈퍼유저 `app_runtime` role(RLS 격리 유지), 마이그레이션만 슈퍼유저
- [x] api 포트 ↔ `apps/api/service.yaml` 드리프트 테스트(vitest)
- [x] `verify.sh`(kind 생성→빌드→load→apply→health) + README(운영 확장 가이드)

### Phase 컨텍스트
- **Phase**: `phase-22` (Deploy — 보일러플레이트 마지막 단계)
- **본 SPEC 의 역할**: phase-22 의 유일 spec. k8s 배포 예제 잔여분을 채워 phase 를 완료 가능 상태로 만든다.

## 🎯 Key Review Points

1. **포트 SoT 정합**: `api.yaml` 의 containerPort/Service 포트가 `apps/api/service.yaml`(2026)과 일치 — `manifest-drift.test.ts` 가 강제.
2. **RLS 안전 모델**: 런타임 `DATABASE_URL`=app_runtime(비-슈퍼유저), 마이그레이션 `DATABASE_MIGRATE_URL`=슈퍼유저. `NODE_ENV=production` 가드(약한 시크릿/슈퍼유저 런타임 거부)를 통과하도록 secret.yaml 구성.
3. **샘플 시크릿**: `secret.yaml` 은 로컬 검증용 더미값 + "운영 교체 필수" 경고. 시크릿 가드 훅 오탐은 의도된 샘플로 warn 처리.

## 🧪 Verification

### 자동 테스트
```bash
npx vitest run tooling/k8s
pnpm tooling:manifest
kubectl apply --dry-run=client -f tooling/k8s/
```
**결과 요약**:
- ✅ `manifest-drift.test.ts`: 4 passed
- ✅ `tooling:manifest`: service manifest 검증 통과
- ✅ kubectl client dry-run: 8 리소스 valid

### 통합 테스트 (로컬 kind)
```bash
bash tooling/k8s/verify.sh
```
- ✅ db-migrate Job 완료 → api/worker rollout 성공
- ✅ api `/health/ready` → `{"status":"ready"}`
- ✅ worker `[worker] consumer started (queue=default, redis=redis:6379)`

### 수동 검증 시나리오
1. **apply → health**: kind 적용 → migrate 완료 → api readiness 200
2. **cleanup**: `verify.sh --cleanup` → 네임스페이스 + 클러스터 정리

## 📦 Files Changed

### 🆕 New Files
- `tooling/k8s/namespace.yaml` · `config.yaml` · `secret.yaml`: ns + 설정/비밀
- `tooling/k8s/postgres.yaml` · `redis.yaml`: 인프라(emptyDir) + Service
- `tooling/k8s/migrate-job.yaml`: `pnpm db:migrate` Job
- `tooling/k8s/api.yaml` · `worker.yaml`: 앱 워크로드
- `tooling/k8s/verify.sh`: 로컬 kind 검증 스크립트
- `tooling/k8s/__tests__/manifest-drift.test.ts`: 포트 드리프트 테스트
- `tooling/k8s/README.md`: 구조·검증·운영 확장 가이드

**Total**: 11 new files (+ spec 산출물)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과
- [x] 통합 테스트(로컬 kind) 통과
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-22.md`
- Walkthrough: `specs/spec-22-01-k8s-manifest-example/walkthrough.md`
