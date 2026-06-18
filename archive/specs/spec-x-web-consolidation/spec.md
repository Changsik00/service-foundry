# spec-x-web-consolidation: frontend 앱 단일화 (web-vite 삭제 + depcruise 가드 대체)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-web-consolidation` |
| **Phase** | `phase-x` |
| **Branch** | `spec-x-web-consolidation` |
| **상태** | Plan Accepted |
| **타입** | Refactor |
| **Integration Test Required** | no |
| **작성일** | 2026-06-10 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

frontend 앱이 2개 존재한다:

- `apps/web-next` — Next.js 16 App Router. 인증 SDK 통합 + Supabase 로그인 full-stack e2e 보유 (spec-x-auth-http-integration). 실질적 주력 앱.
- `apps/web-vite` — Vite 8 + TanStack Router SPA. 헬스체크 데모 수준 (소스 8개 파일). 조립 패키지는 `http-client` / `ui` / `errors` 3개뿐.

web-vite의 명분은 "`packages/frontend/*`가 Next 없이도 동작한다는 검증장" (확정 스택: Next+Vite 둘 다).

### 문제점

1. **검증 범위가 부분적** — web-vite가 실제 조립하는 frontend 패키지는 3개뿐. `auth-store`, `auth-react`, `auth-supabase` 등 핵심 패키지는 web-vite를 거치지 않아 "framework-agnostic 증명"이 실효 없음.
2. **유지 비용은 전역적** — frontend 패키지·env 체계·CI 변경 시마다 두 앱 정합 필요 (예: CSRF wiring spec-15-02/16-03 이중 작업).
3. **더 싸고 완전한 가드가 이미 존재** — `@repo/depcruise-config` 정적 룰로 `packages/frontend/* → next` 의존을 금지하면 전 패키지를 CI에서 커버.
4. 디자인 시스템 + auth 화면 작업(design-md 합성 프로젝트)의 타깃 단일화 선행 필요.

### 해결 방안 (요약)

web-vite를 삭제하고, framework-agnostic 보장을 depcruise 정적 룰(`frontend-no-next-imports`)로 대체한다. "Next+Vite 둘 다" 확정 스택 결정은 ADR-0025로 공식 번복한다.

## 🎯 요구사항

### Functional Requirements

0. **(추가 2026-06-10)** `apps/web-next` → `apps/web` rename + 별도 admin 앱 계획 폐기 (단일 web = 콘솔). ADR-0025 §4·§5.

1. **ADR-0025** — frontend 앱 단일화 결정 기록 (기존 결정 번복 사유 + 대체 가드 명시)
2. **depcruise 가드** — `packages/frontend/*` 및 `packages/react/*`에서 `next` 패키지 의존 금지 룰 추가, 위반 시 error
3. **web-vite 완전 제거** — `apps/web-vite/` + `docs/reference/apps/web-vite.md` 삭제, lockfile 재생성
4. **현행 문서/설정 참조 정리** — README, docs/index, docs/reference/{stack,architecture}, env.sample, root package.json scripts, knip-config, typescript-config display, ARCHITECTURE.md, web-next 주석 2곳

### Non-Functional Requirements

1. **이력 문서 불변** — specs/, backlog/, 기존 ADR 본문, docs/review 는 point-in-time 기록이므로 수정하지 않음 (ADR-0004/0006/0021 에 ADR-0025 참조 노트 한 줄만 허용)
2. **검증 그린** — `pnpm install` 후 turbo lint/typecheck/test/build + knip + depcruise 전부 통과

## 🚫 Out of Scope

- 디자인 시스템 문서 (DESIGN/TOKEN/FRONT/ARCHITECTURE) 작성 → spec-x-design-md
- web-next 내부 구조 개편 (lib/ 평면 정리) → spec-x-auth-screens 시점
- `packages/react/*` 카테고리 자체의 존폐 논의

## 📑 ADR 후보 (Architecture Decision Records)

- [x] ADR 가치 있는 결정 있음 → `frontend-app-consolidation` (type: decision — 확정 스택 번복 + 정적 가드 대체)

## 🔗 관련 문서 (Related)

- 관련 ADR: ADR-0003 (패키지 레이아웃), ADR-0015 (framework adapter), ADR-0025 (본 spec 산출)
- 관련 spec: spec-x-auth-http-integration (web-next e2e), spec-15-02 / spec-16-03 (이중 유지 비용 사례)

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-x-web-consolidation` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
