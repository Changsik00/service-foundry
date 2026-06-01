# Walkthrough: spec-14-06 — CI 릴리스 + docker

> api/worker Dockerfile + changesets/ghcr release 워크플로. phase-14 마지막 spec. 성공 기준 6.

## 📌 결정 기록
| 이슈 | 결정 | 이유 |
|---|---|---|
| 실행 방식 | `tsx src/main.ts`(watch 없음) | build 파이프라인 부재 — tsx 직접 |
| base 이미지 | node:24-slim | argon2/sharp 등 native prebuild(glibc) 호환 |
| install | `--frozen-lockfile`(devDep 포함) | 재현성 + tsx 런타임 필요 |
| prepare | `lefthook install \|\| true` | git 없는 docker 컨텍스트에서 install 실패 방지 |
| docker build 위치 | release(main)만 | verify(매 PR) 속도 유지 |
| publish | npm 안 함 / ghcr docker | private boilerplate |

### ADR 승격
- [x] 없음

## 🧪 검증 결과
- **로컬 docker build 성공** — `service-foundry-api` + `service-foundry-worker` (node:24-slim, frozen install, ~1.61GB)
- release.yml / verify.yml YAML 유효(node `yaml` 파서)
- verify 게이트 무변경 — 본 PR CI green (단위/typecheck 전체)
- release 워크플로 자기검증은 **머지 후 main 에서 관측**(changesets action + ghcr push)

## 🔍 발견 사항
- root `prepare`(lefthook install)가 .git 없는 컨텍스트(docker, dockerignore 로 .git 제외)에서 install 을 깨뜨림 → `|| true` 로 관대화(로컬/CI 는 .git 있어 정상 동작).
- api/worker 에 prod 실행 스크립트가 없었음(`tsx watch` dev 만) → `start:prod` 신설.
- 이미지 1.61GB — 전체 workspace + devDep 포함. 최적화(멀티스테이지 prune / --prod + 번들)는 후속.

## 🚧 이월 항목
- 이미지 슬림화(workspace prune, 번들 후 --prod).
- web-next/web-vite 이미지.
- k8s manifest·실제 배포 → phase-15.

## 🔗 관련
- phase-14 성공 기준 6. phase-15(deploy) 선행. changesets 설정은 기존 `.changeset/`.

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | feat 2 + ship 1 |
