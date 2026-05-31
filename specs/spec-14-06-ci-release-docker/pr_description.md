# feat(spec-14-06): CI 릴리스 + docker 이미지

## 📋 Summary
### 배경
verify(PR 게이트)만 있고 릴리스 자동화·배포 산출물 부재. api/worker 는 prod 실행 스크립트도 없었음.
### 주요 변경
- [x] api/worker `start:prod`(tsx, watch 없음) + `apps/{api,worker}/Dockerfile`(node:24-slim, 모노레포 루트 컨텍스트, frozen install) + 루트 `.dockerignore`.
- [x] root `prepare` → `lefthook install || true` (git 없는 docker 컨텍스트 관대화).
- [x] `.github/workflows/release.yml` — main 푸시 시 changesets "Version Packages" PR(npm publish 안 함) + api/worker 이미지 ghcr.io push(sha+latest, matrix).

### Phase 컨텍스트
- phase-14 성공 기준 6 (마지막 spec). k8s/실배포는 phase-15.

## 🎯 Key Review Points
1. **로컬 docker build 양쪽 성공** 검증(api/worker).
2. release 워크플로 자기검증은 **머지 후 main 에서** (changesets action + ghcr) — PR 에선 build/YAML/verify 로 검증.
3. verify(매 PR) 게이트 무변경 — docker build 는 release(main)에서만.

## 🧪 Verification
```bash
docker build -f apps/api/Dockerfile -t sf-api .       # 성공
docker build -f apps/worker/Dockerfile -t sf-worker . # 성공
node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/release.yml','utf8'))"  # OK
```
+ 본 PR `verify` CI green.

## ✅ Definition of Done
- [x] Dockerfiles 로컬 build + start:prod
- [x] release.yml YAML 유효 + verify 무변경
- [ ] 본 PR CI green (관측) / release 동작은 머지 후 main

## 🔗 관련
- 후속: 이미지 슬림화, web 이미지, phase-15(deploy/k8s).
