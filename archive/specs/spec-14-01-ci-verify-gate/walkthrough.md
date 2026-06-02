# Walkthrough: spec-14-01 — CI PR 검증 게이트

> GitHub Actions `verify` 워크플로 — clean 환경에서 frozen-lockfile + turbo lint/typecheck/test/build(+ e2e). phase-14 첫 spec, #80 재발 차단.

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CI 배치 | 15 / 14 | **14 (사용자)** | #80 — PR 게이트가 결정론적 차단 |
| e2e 처리 | 단위만 / 서비스컨테이너 / 최소 | **postgres service + 전체 test (사용자)** | 풀 커버리지 |
| redis | 포함 / 제외 | **제외** | throttler in-memory, e2e 가 redis 불요(로컬 85/85 확인) |
| NOTIFIER 단위버그 | 게이트 밖 / 같이 수정 | **같이 수정** | 게이트는 그린이어야 의미. 실제 결함 |

### ADR 승격
- [x] 없음 (표준 Actions)

## 🧪 검증 결과
### 로컬 (CI 동등 명령 그대로)
```
docker run postgres:16-alpine -p 5434:5432 (POSTGRES_PASSWORD=test, DB=test)
DATABASE_URL=postgres://postgres:test@localhost:5434/test
pnpm install --frozen-lockfile        → OK
pnpm --filter @apps/api db:migrate     → 8 migrations applied
pnpm turbo run lint typecheck test build --force → 129/129 successful
```
- apps/api 단위(confirm) NOTIFIER 수정 후: 11/11, 전체 apps/api 85/85(e2e 포함).
### 통합 (Integration Test Required = yes)
- 본 PR `verify` 워크플로 → **green** (run 26701277137, 2m8s). 워크플로 자기 검증 완료.

### CI 수렴 기록 (게이트가 clean 환경에서 잡은 잠재 결함 — 4 라운드)
1. **ERR_PNPM_IGNORED_BUILDS** (`@firebase/util`/`protobufjs`): pnpm 11 clean install 은 미승인 build script 를 에러 처리 → `allowBuilds: false` 명시.
2. **NOTIFIER 단위버그** (confirm 테스트 8): mock 누락 보정.
3. **crypto 타임아웃** (`backend-auth-mfa` 등): bcrypt/argon2 가 2-core 러너에서 5s 초과 → 공유 vitest 프리셋 testTimeout/hookTimeout CI 30s.
4. **routeTree.gen.ts 부재** (`web-vite`): TanStack 생성 파일(gitignored)이 clean checkout 엔 없음 → 패키지 turbo.json 에서 typecheck→build 의존.
> 전부 로컬(빠른 머신 + already-built)에선 안 보이던 누수. 게이트의 존재 이유를 즉시 입증.

## 🔍 발견 사항 (게이트가 즉시 잡은 잠재 결함)
- **apps/api 31 fail 잠재**: (a) `password-reset/email-verify .confirm.service.test.ts` 가 phase-12 NOTIFIER 포트 도입 후 mock 누락(8) → 형제 테스트 패턴대로 수정. (b) `auth.e2e.test.ts`(~23, real PG) 는 인프라 의존 → service container 제공으로 해소.
- 로컬 lefthook(typecheck only) + turbo 캐시로는 이 test 회귀를 못 막았다 — 게이트의 존재 이유.

## 🚧 이월 항목
- **knip / depcruise 게이트** — 루트 실행 진입점(스크립트/설정) 미배선 → 후속(배선 + 게이트 추가). 성공 기준 5 의 knip/depcruise 부분 이연.
- e2e 에 `skipIf(infra)` 가드 부재(현재 DATABASE_URL 하드 기본값) — 후속 위생 개선 여지.
- turbo remote cache, OS/node matrix → 후속.

## 🔗 관련
- 관련 phase: `backlog/phase-14.md` (성공 기준 5 — knip/depcruise 제외 충족)
- 관련: [[feedback_no_pipe_git_commit]] (#80 근본 원인)
- 후속: spec-14-06 (changesets + docker), knip/depcruise 배선

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | docs 1 + fix 1 + feat 1 + ship 1 |
