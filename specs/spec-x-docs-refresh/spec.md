# spec-x-docs-refresh: 문서 최신화 + spec 아카이브 정리

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-docs-refresh` |
| **Phase** | 없음 (spec-x) |
| **Branch** | `spec-x-docs-refresh` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Docs |
| **작성일** | 2026-07-08 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

phase-17~26 을 거치며 멀티테넌시·RBAC·데이터 UX·어드민+빌링·k8s 배포·ID 체계(public_id) 등 대규모 기능이 추가됐지만, 루트 `README.md` 는 이 변화를 반영하지 못한 채 정체돼 있다. 또한 `specs/` 에 완료된 spec 디렉토리 33개, `backlog/`에 완료된 phase 파일 4개(phase-23~26)가 archive 되지 않고 남아 있다.

### 문제점

1. **README 불일치**: "앱 4개" 표기(§27) vs 실제 표/본문은 3개(api·web·worker) — 문서 내부 모순. 패키지 개수도 stale(backend 22→실제 26, nestjs 6→9, frontend 7→8). "핵심 역량" 절엔 멀티테넌시/조직·RBAC/어드민+빌링/k8s 배포 등 최근 6개 phase 의 핵심 산출물이 전혀 언급되지 않아 신규 독자가 프로젝트 현재 범위를 오판할 수 있다.
2. **아카이브 누적**: `sdd status` 진단이 이미 두 항목을 감지 — specs/ 33개 디렉토리, 완료 phase 4개(phase-23~26) backlog 잔존. `sdd archive` 미실행 상태.
3. **문서 drift**: `docs/index.md` 패키지 reference 목록에 `backend-tenant`/`backend-schema`/`nestjs-tenant` 3개 패키지 항목이 누락(Icebox 기록됨, phase-24 회고 이월).

### 해결 방안

README 의 앱/패키지 수치와 핵심 역량 절을 실제 상태로 갱신하고, `sdd archive` 로 완료된 spec/phase 를 정리하며, `docs/index.md` 에 누락된 3개 패키지 reference 항목을 추가한다. 코드 변경 없는 순수 문서/하우스키핑 작업이다.

## 요구사항

1. `README.md` "앱 4개" → "앱 3개"로 수정하고 패키지 카테고리별 개수를 `packages/<category>/*` 실제 디렉토리 수와 일치시킨다.
2. `README.md` "핵심 역량" 절에 멀티테넌시(조직/초대)·RBAC/인가·데이터 UX·어드민+빌링·k8s 배포·public_id 체계 항목을 추가한다.
3. `sdd archive` 를 실행해 완료된 spec/phase 를 `archive/` 로 이동한다 (`--dry-run` 으로 대상 확인 후 실행).
4. `docs/index.md` Reference — 패키지 절에 `@repo/backend-tenant`, `@repo/backend-schema`, `@repo/nestjs-tenant` 항목을 추가한다 (기존 항목과 동일한 1줄 요약 포맷).
5. 위 변경 후 `docs/index.md` 의 backend/nestjs 패키지 개수 표기(`core, 23` 등)도 실제 디렉토리 수에 맞춘다.

## Out of Scope

- 각 신규 패키지(`backend-tenant`/`backend-schema`/`nestjs-tenant`)의 상세 reference 페이지(`docs/reference/packages/*.md`) 신규 작성 — 1줄 인덱스 항목만 추가. 상세 페이지 작성은 별도 spec-x 후보로 Icebox 유지.
- `docs/explainers/platform/ci-verify-gate.md` 의 web-vite 잔재 설명 갱신 — 단순 이름치환이 아니라 별도 검토가 필요하다고 Icebox 에 이미 명시돼 있어 이번 스코프에서 제외.
- `turbo/generators/config.ts` 의 vite 옵션 정리(코드 변경) — 문서가 아닌 코드 drift라 이번 spec-x(docs) 스코프 밖.
- 로컬 `apps/web-vite/` untracked 잔재물(routeTree.gen.ts 등) 삭제 — git 추적 대상이 아니라 PR에 영향 없음, 별도 로컬 정리로 처리.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 없음 — 코드 변경 없는 문서/하우스키핑, breaking change 없음.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **README** | 수치 정정 + 핵심 역량 bullet 확장 | 문서 자체 모순 해소 + 최근 6개 phase 반영 |
| **archive** | `sdd archive --dry-run` 으로 대상 확인 후 실행 | 되돌리기 쉬운 git mv 성격, 실수 방지 |
| **docs/index.md** | 누락 3패키지 1줄 인덱스만 추가 | 상세 페이지는 스코프 밖(Out of Scope), drift만 해소 |

## Proposed Changes

#### [MODIFY] `README.md`
- "앱 4개" → "앱 3개"
- 패키지 카테고리별 개수 정정 (backend/nestjs/frontend 실측치 반영)
- "핵심 역량" 절에 멀티테넌시/RBAC/데이터 UX/어드민+빌링/k8s/public_id 항목 추가

#### [MODIFY] `docs/index.md`
- Reference — 패키지 절에 `backend-tenant`/`backend-schema`/`nestjs-tenant` 1줄 항목 추가
- backend/nestjs 카테고리 개수 표기 정정

#### [ARCHIVE] `specs/*` (완료분), `backlog/phase-23.md`~`phase-26.md`
- `sdd archive` 실행 결과로 `archive/` 로 이동 (자동 처리, 파일 단위 diff는 이동 위주)

## 검증 계획

```bash
# 문서 변경 검증 — 코드 아님, lint/typecheck 대상 없음
grep -c "앱 3개" README.md   # 1 이상
ls packages/backend | wc -l  # README 표기와 일치 확인
bash .harness-kit/bin/sdd status  # archive 후 drift 항목 소거 확인
```

수동 검증 시나리오:
1. `README.md` 를 처음부터 끝까지 읽고 앱/패키지 개수 표기가 서로 모순되지 않는지 확인 — 기대 결과: 전부 "3개"/실측치로 일치.
2. `sdd status` 재실행 — 기대 결과: "specs/ N개 디렉토리" · "완료 phase backlog 잔존" 진단 문구 소거 또는 대상 감소.
3. `docs/index.md` 의 backend 섹션에서 `backend-tenant`/`backend-schema` 검색 — 기대 결과: 항목 존재.

## 롤백 계획

- `git revert` — 코드 실행 경로 변경 없음, 문서 + `git mv` 성격의 아카이브 이동만 존재해 되돌리기 단순.

## ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] 없음 — 문서 정리 성격, 아키텍처 결정 없음.

## ✅ Definition of Done

- [ ] README/docs 변경 반영
- [ ] `sdd archive` 실행 완료
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-x-docs-refresh` 브랜치 push 완료
