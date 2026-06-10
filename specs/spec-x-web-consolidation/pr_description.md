# spec-x: frontend 앱 단일화 — web-vite 삭제, depcruise 정적 가드로 대체

## 결정 (ADR-0025)

frontend 앱을 `apps/web-next` 단일로 통합한다. web-vite 의 존재 명분이었던
"`packages/frontend/*` 가 Next 없이 동작한다는 검증"은 depcruise 정적 룰로 대체한다.

| | web-vite (기존) | depcruise 룰 (대체) |
|---|---|---|
| 검증 범위 | 실제 조립한 3개 패키지뿐 (`http-client`·`ui`·`errors`) | **전 frontend/react 패키지** |
| 유지 비용 | 패키지·env·CI 변경마다 이중 정합 (spec-15-02/16-03 사례) | 0 |
| 실행 시점 | 수동 dev/build 시 | CI 매 커밋 |

## 변경 내용

### 1. ADR-0025 (`docs/adr/0025-frontend-app-consolidation.md`)

"Next+Vite 둘 다" 확정 스택 결정을 공식 번복. ADR-0004/0006/0021 상단에 참조 노트 1줄 (본문 불변 — point-in-time 기록).

### 2. depcruise 가드 (`packages/config/depcruise-config/base.cjs`)

```js
{
  name: "frontend-no-next-imports",
  severity: "error",
  from: { path: "^packages/(frontend|react)/" },
  to: { path: "(^|/)node_modules/next/|^next(/|$)" },
}
```

- 이중 패턴: pnpm 해석 경로(`node_modules/.pnpm/next@x/...`) + 미선언 import 의 raw specifier 모두 매치
- **Red→Green 검증**: 초안 패턴(`^node_modules/next`)은 발화하지 않음을 수동 Red 로 발견 → 보강 후 두 위반 형태 모두 발화 확인 (walkthrough 증거 로그)

### 3. web-vite 삭제 + 참조 정리 (33 files, −1,060 lines)

- `apps/web-vite/`, `docs/reference/apps/web-vite.md` 삭제
- 현행 문서/설정 정리: README · docs/index · docs/reference/{stack,architecture} · ARCHITECTURE.md · env.sample · root package.json (`dev:web-vite`) · knip-config · typescript-config · backlog/queue.md Icebox 3건 · turborepo-rules §5.2 · web-next 주석 2곳
- catalog 잔재 4건 제거 (vite · @tanstack/react-router · @tanstack/router-plugin · @tailwindcss/vite) + knip `routeTree\.gen` ignoreUnresolved 제거
- 이력 문서(specs/, backlog done, ADR 본문, review)는 불변

### 4. web rename + admin 계획 폐기 (추가, ADR-0025 §4·§5)

- `apps/web-next` → **`apps/web`** (`@apps/web`) — `-next` 접미사는 web-vite 구별용이었음. 앱 이름은 역할(api·web·worker), 프레임워크는 구현 디테일
- **별도 `apps/admin` 계획 폐기** — web 단일 앱이 콘솔(어드민 성격)로 로그인/회원가입/테넌트 관리를 모두 담음. queue.md Icebox 항목 해소
- 현행 참조 25파일 치환 (e2e.yml · docs · configs · service.yaml · manifest fixture)

## 검증

- `pnpm depcruise` — ✔ no violations (442 modules)
- `pnpm turbo lint typecheck build` — 95/95 PASS (rename 후 재검증)
- `pnpm turbo test --filter='!@apps/api'` — 44/44 PASS
- `pnpm knip` — exit 0
- `@apps/api#test` (real PG e2e) 로컬 실패는 main 에서도 동일 재현되는 pre-existing 환경 문제 (Redis 부재) — CI 에서 검증

## 후속

- spec-x-design-md — DESIGN/TOKEN/FRONT/ARCHITECTURE 4문서 (web-next 단일 타깃)
- spec-x-ui-tokens / spec-x-auth-screens
