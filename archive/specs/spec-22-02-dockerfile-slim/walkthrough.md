# Walkthrough: spec-22-02

> api/worker Dockerfile 슬림화 (turbo prune + --prod).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 슬림화 방식 | pnpm deploy --prod / turbo prune + --prod | **turbo prune + --prod** | deploy 는 @repo/* 를 node_modules 로 이동 → tsx 가 데코레이터 tsconfig 를 적용 못 해 NestJS 크래시. prune 은 워크스페이스 심볼릭링크(packages/*) 보존 → tsx 정상 |
| 전이 의존성 해석 | 기본 / `--shamefully-hoist` | **--shamefully-hoist** | 일부 워크스페이스 패키지(예: backend-auth-audit)가 drizzle-orm 을 hoisting 에 의존해 import → fat 이미지의 평탄 해석 동작 복원 |
| tsx·drizzle-kit·dotenv | devDep 유지 / 런타임 deps | **런타임 deps 이동** | --prod 가 devDep 을 제거 → tsx(런타임)·drizzle-kit(migrate Job)·dotenv(drizzle.config import) 가 사라져 기동·마이그레이션 실패 |
| migrate 실행 | `pnpm run db:migrate` / drizzle-kit 바이너리 | **drizzle-kit 직접** | slim 이미지는 비-workspace 컨텍스트라 `pnpm run` 이 `catalog:` 해석 실패 → 바이너리 직접 실행으로 pnpm 우회 |
| 런타임 진입 | `pnpm run start:prod` / tsx 바이너리 | **tsx 바이너리 직접** | pnpm deps-check/catalog 우회, CMD 단순화 |

<!-- ADR 미승격: 표준 turborepo prune 패턴 적용. phase-22.md 결정 기록 + 본 표로 충분. -->

## 💬 사용자 협의

- **주제**: phase-22 가 단일 spec 으로 충분한가
  - **합의**: infra phase 이므로 base branch 모드로 전환 + 본 spec(Dockerfile 슬림화) 추가. PR #155 를 phase 브랜치로 retarget.
- **주제**: 슬림화 깊이 (prune-only 14% vs 진짜 슬림)
  - **합의**: `--prod` 로 devDep 제거하는 진짜 슬림 추진 (Option 1).
- **주제**: 작업 중단 / 재개
  - Docker 과부하로 1차 중단 → draft PR #156 보존 → Docker 정리 후 재개.

## 🧪 검증 결과

### 자동 테스트
- **명령**: `turbo run lint typecheck`
- **결과**: ✅ 96/96 PASS

### 이미지 크기 (정량)
| 이미지 | Before | After | 감소 |
|---|---|---|---|
| api | 1.67GB | **1.25GB** | ~25% |
| worker | 1.67GB | **512MB** | ~69% |

- devDep(biome/turbo/typescript/vitest 일부) 제거, tsx·drizzle-kit·dotenv·drizzle-orm 최상위 hoist 확인.

### 통합 검증 (로컬 kind)
- **명령**: `bash tooling/k8s/verify.sh`
- **결과**: ✅ PASS
```text
▶ 5) job.batch/db-migrate condition met
▶ 6) deployment "api" / "worker" successfully rolled out
▶ 7) api /health/ready → {"status":"ready"}
▶ 8) [worker] consumer started (queue=default, redis=redis:6379)
✓ 검증 통과
```

## 🔍 발견 사항 (디버깅 여정)

1. **pnpm deploy → 데코레이터 크래시**: `Parameter decorators only work when experimental decorators are enabled` — deploy 가 @repo/* 를 node_modules 안으로 옮기면 tsx/esbuild 가 해당 파일에 `--tsconfig` 를 적용하지 않음. → turbo prune(심볼릭링크 보존)으로 전환.
2. **migrate `catalog:` 실패**: slim 이미지에서 `pnpm run` 이 워크스페이스 catalog 를 못 풀어 `No catalog entry 'dotenv'`. → drizzle-kit 바이너리 직접 실행.
3. **drizzle-orm 미해석**: `--prod` 엄격 링크로 backend-auth-audit 의 drizzle-orm 미링크(fat 은 hoist 로 해결했던 것). → `--shamefully-hoist`.
4. **dotenv 누락**: api devDep 이라 --prod 에서 제거 → drizzle.config import 실패. → deps 이동.
5. **`next` 잔존**: `@env-kit/node-settings@1.1.0` 이 `next` 를 직접 의존 → backend-settings 경유 api 까지. slim 에도 포함됨. dep 정리 사안(Icebox).

## 🚧 이월 항목

- **`@env-kit/node-settings` 의 next 의존 제거/대체** → 이미지에서 next(~288MB) 제거 시 추가 대폭 감소 가능. `backlog/queue.md` Icebox.
- 추가 슬림(컴파일 tsup → node 런타임, tsx 제거)·distroless 베이스 → 후속 spec 후보.
