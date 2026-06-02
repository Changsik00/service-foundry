# spec-14-06: CI 릴리스 + docker 이미지

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-06` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-06-ci-release-docker` |
| **상태** | Planning |
| **타입** | Feature (CI/CD) |
| **Integration Test Required** | yes (docker build 로컬 검증; release-action 은 머지 후) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
- `verify.yml`(PR 게이트)만 존재. **릴리스 자동화·배포 산출물(docker)이 없다.**
- changesets 는 이미 설정됨(`.changeset/config.json`) — 버전/changelog 도구는 있으나 워크플로 미배선.
- `apps/api`·`apps/worker` 는 **prod 실행 스크립트 부재**(`tsx watch` dev 만) → 컨테이너로 띄울 수 없음.

### 문제점
- 배포 가능한 이미지가 없어 "운영 가능 보일러플레이트" 미완.
- 릴리스 버전/changelog 수작업.

### 해결 방안 (요약)
(1) api/worker prod start 스크립트 + Dockerfile, (2) changesets release PR + ghcr docker publish 워크플로.

## 🎯 요구사항

### Functional Requirements
1. **prod start**: `apps/api`·`apps/worker` 에 `start:prod`(`tsx src/main.ts`, watch 없음).
2. **Dockerfile**: `apps/api/Dockerfile`·`apps/worker/Dockerfile` — node 24-alpine + corepack pnpm, 모노레포 루트 컨텍스트, `--frozen-lockfile` 설치 후 `start:prod`.
3. **`.github/workflows/release.yml`**: `push: main` 에서
   - changesets/action → "Version Packages" PR 자동 생성(버전/changelog; **npm publish 안 함** — private).
   - api/worker docker 이미지 build + `ghcr.io` push (tag: sha + latest).

### Non-Functional Requirements
1. docker 이미지는 `--frozen-lockfile` (재현성). 시크릿은 GITHUB_TOKEN/OIDC (평문 금지).
2. verify 게이트(매 PR)는 **변경 없음** — docker build 는 release(main) 에서만(PR 부담 회피). Dockerfile 검증은 로컬 `docker build`.

## 🚫 Out of Scope (후속 / phase-15)
- k8s manifest·실제 배포(deploy) → phase-15.
- web-next/web-vite 이미지 → 후속(우선 backend api/worker).
- npm registry publish → 안 함(private boilerplate).

## 📑 ADR 후보
- [ ] 없음 (표준 changesets/ghcr 구성)

## 🔗 관련 문서 (Related)
- phase-14 성공 기준 6. phase-15(deploy) 선행.

## ✅ Definition of Done
- [ ] api/worker `start:prod` + Dockerfile, **로컬 `docker build` 성공**
- [ ] `release.yml` (changesets Version PR + ghcr push) YAML 유효
- [ ] verify 게이트 무변경 — 전체 단위/typecheck green (본 PR CI)
- [ ] walkthrough / pr_description ship + PR + CI green
- [ ] (머지 후) release 워크플로 동작은 main 에서 관측
