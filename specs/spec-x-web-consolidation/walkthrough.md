# Walkthrough: spec-x-web-consolidation

> 본 문서는 *작업 기록* 입니다. 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| web-vite 처분 | 동결 유지 / 전 패키지 조립장으로 확장 / 삭제+정적 가드 | **삭제 + depcruise 가드** | 검증 범위가 3개 패키지뿐이라 "framework-agnostic 증명" 실효 없음. 정적 룰이 전 패키지를 더 싸게 커버 (사용자 결정, 2026-06-10) |
| depcruise 룰 매칭 | `^node_modules/next` 단일 패턴 | **`(^|/)node_modules/next/\|^next(/\|$)` 이중 패턴** | 초안이 Red 검증에서 **발화 안 함** — pnpm 해석 경로(`node_modules/.pnpm/...`)와 미선언 import 의 raw specifier 둘 다 커버 필요 |
| 이력 문서 처리 | 전부 갱신 / 전부 불변 | **불변 + 기존 ADR 3건에 참조 노트 1줄** | ADR 은 point-in-time 기록. 번복은 ADR-0025 가 담당 |
| catalog 잔재 | 방치 / 정리 | **정리** (vite·@tanstack/react-router·router-plugin·@tailwindcss/vite + knip `routeTree\.gen` ignoreUnresolved) | knip 이 unused 로 검출 — web-vite 전용 항목 확인 후 제거 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → 작성됨: `docs/adr/0025-frontend-app-consolidation.md`

## 🤝 사용자 협의 기록

- 2026-06-10: dennis — "web-vite 가 Next 없이 돌아간다는 건 이미 Next 에서 돌아가면 증명됨 … 삭제 가능", "web 은 그냥 1개면 되지 않을까", "진행하자" → Plan Accept
- 에이전트 카운터: "Next에서 돌면 어디서나 돈다"는 방향이 반대(Next 전용 API 가 Vite 에서 깨짐)이나, **결론은 타당** — web-vite 의 증명 범위가 원래 부분적(3개 패키지)이었고 depcruise 정적 룰이 더 완전한 가드라는 근거로 합의

## 🧪 검증 결과 (증거)

### depcruise 가드 Red→Green (Task 2)

```
# Red 1 — 미선언 import (raw specifier)
error frontend-no-next-imports: packages/frontend/http-client/src/index.ts → next/navigation
x 1 dependency violations (1 errors, 0 warnings)

# Red 2 — 선언된 dep (pnpm 해석 경로)
error frontend-no-next-imports: packages/frontend/http-client/src/index.ts
  → node_modules/.pnpm/next@16.2.6_.../node_modules/next/navigation.js
x 1 dependency violations (1 errors, 0 warnings)

# Green — 위반 제거 후
✔ no dependency violations found (455 modules, 1093 dependencies cruised)
```

> 초안 룰(`^node_modules/next`)은 Red 1 에서 **발화하지 않았음** — 수동 Red 검증이 침묵 실패를 잡아냄. 이중 패턴으로 보강 후 두 케이스 모두 발화 확인.

### 삭제 후 전체 게이트 (Task 3)

```
pnpm depcruise                        ✔ no dependency violations (442 modules)
pnpm turbo lint typecheck build       93/93 successful (api 포함 29/29)
pnpm turbo test --filter='!@apps/api' 44/44 successful
pnpm knip                             exit 0 (unused catalog 4건 → 정리 완료)
grep -rn "web-vite"                   이력 문서(specs/backlog done/ADR/review/explainer)
                                      + 의도된 참조(ADR-0025, depcruise 주석)만 잔존
```

> `@apps/api#test` (real PG e2e) 는 로컬 Redis 부재로 실패 — **main 에서도 동일 실패 재현** (pre-existing 환경 문제, 본 spec 무관). CI 서비스 컨테이너에서 검증.

## 📌 추가 결정 (2026-06-10, PR 생성 후)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `web-next` 이름 | 유지 / `web` rename | **`web`** | `-next` 접미사는 web-vite 구별용 흔적 기관. api·worker 처럼 역할 이름으로 통일 (dennis) |
| admin 앱 | 별도 앱 후속 / web 내 route / 폐기 | **별도 admin 폐기 — web 단일 앱이 콘솔(어드민 성격)** | "web 이걸 그냥 admin 이라고 생각해서 만들면 될 것 같아" (dennis). 빈 두 번째 frontend 는 web-vite 의 재생산 |

검증(rename 후): depcruise ✔ (442 modules) / turbo lint·typecheck·build 95/95 / test(api 제외) 44/44 / knip exit 0.

## 📦 Commits

1. `fbd2942` docs: adr-0025 frontend 앱 단일화 (+ spec 문서)
2. `a7f08bf` feat: depcruise next-금지 가드 추가
3. `bedf672` chore: web-vite 삭제 및 참조 정리 (33 files, -1,060 lines)
4. `1bfd75a` docs: ship walkthrough and pr description
5. refactor: web-next → web rename + admin 계획 폐기
