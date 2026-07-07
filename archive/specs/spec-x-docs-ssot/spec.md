# spec-x-docs-ssot: 문서 SSOT 정책 명문화 + 정리

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-docs-ssot` |
| **Branch** | `spec-x-docs-ssot` |
| **상태** | Planning |
| **타입** | docs |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

SSOT 골격은 이미 있다: `README`(현관) → `docs/index.md`(MOC, SSOT) → `reference/`·`adr/`·`explainers/` 3층. `docs/CONVENTIONS.md` 가 vault 내부 규약을 정의.

### 문제점

- **루트 ↔ docs/ 경계가 정책으로 미명문화** — 어떤 문서가 루트(README/CLAUDE/ARCHITECTURE)에, 어떤 게 docs/ 에, 무엇이 정본인지 규칙이 없다.
- **루트 `ARCHITECTURE.md` = stale 중복** — Phase 3 legacy(§1 폴더구조·§2 패키지목록 "legacy" 박제). 정본은 이미 `docs/reference/architecture.md`(현행). 같은 주제 2곳 → SSOT 위반.
- drift: README "ADR 20개"(실 26)·"패키지 48"(실 ~50), 일부 stale 참조(web-vite/web-next 등 — 이미 제거됨).

### 해결 방안

"문서 위치 / 정본(SSOT)" 정책을 `docs/CONVENTIONS.md` 에 명문화(정책 자체도 한 곳)하고, 그에 맞춰 중복(루트 ARCHITECTURE.md)을 일원화 + drift 를 정정한다.

## 요구사항

1. **SSOT 정책 작성**: 루트↔docs/ 경계 + "주제별 정본 1곳, 나머지는 링크(중복 금지)" 규칙 + topic→canonical 위치 표.
2. **루트 `ARCHITECTURE.md` 일원화**: 정본 = `docs/reference/architecture.md`. 루트엔 unique 유효 내용이 docs 에 있는지 확인 후 **thin pointer**(정본을 가리키는 짧은 문서)로 축소. `docs/index.md` 의 ARCHITECTURE.md 참조 갱신.
3. **`docs/reference/architecture.md` 최신화**: Phase 3 이후 누락 축 보강/확인 — 멀티테넌시+RLS(ADR-0024), 인증 권위 모드(0022/0023), 배포(k8s, phase-22), 어댑터 패턴(0015/0016).
4. **drift 정정**: README ADR/패키지 카운트, docs 전역 stale 참조(web-vite/web-next/Fastify/구 config-*) grep 정정, index.md 신규 등재(ADR-0024~0026, RCA-002/003, k8s/deploy).

## Out of Scope

- ADR 본문 재작성 (결정은 그대로 — 링크만).
- explainers 신규 작성 (별 작업).
- docs/ 디렉토리 구조 자체 개편 (현 3층 유지).

## 핵심 전략

| 항목 | 전략 | 이유 |
|:---:|:---|:---|
| **정책 위치** | `docs/CONVENTIONS.md` 에 섹션 추가 | 규약의 SSOT — 정책도 한 곳 |
| **루트 ARCHITECTURE.md** | thin pointer (삭제 아님) | 루트에서 찾는 사람 위한 발견성 유지 + 중복 0 |
| **정본 architecture** | `docs/reference/architecture.md` | 이미 현행·matklad 스타일 |
| **검증** | grep 으로 stale 참조 0 + 링크 유효 | drift 재발 방지 |

## Proposed Changes

#### [MODIFY] `docs/CONVENTIONS.md`
"문서 위치 / SSOT" 섹션 추가: 루트(README=현관, CLAUDE=에이전트 규약, ARCHITECTURE=pointer) vs docs/ 정본, topic→canonical 표, 중복 금지 규칙.

#### [MODIFY] `ARCHITECTURE.md` (루트)
legacy 본문 → thin pointer (`docs/index.md` + `docs/reference/architecture.md` 정본 안내). unique 유효 내용은 docs 로 이관 확인 후 제거.

#### [MODIFY] `docs/reference/architecture.md`
누락 축(멀티테넌시/RLS·인증 모드·배포·어댑터) 보강 + ADR 링크.

#### [MODIFY] `README.md` · `docs/index.md`
카운트/링크 drift 정정 + 신규 항목 등재.

## 검증 계획

```bash
# stale 참조 0
grep -rniE 'web-vite|web-next|fastify|config-eslint|config-typescript' docs README.md ARCHITECTURE.md
# 링크 유효성(상대경로 파일 존재) 수동 확인
pnpm turbo run knip depcruise   # 문서는 무영향, 회귀 가드
```

수동 검증 시나리오:
1. CONVENTIONS 의 SSOT 표대로 각 주제 정본이 1곳인지 대조
2. 루트 ARCHITECTURE.md → 정본 링크만 (중복 본문 없음)
3. stale grep 결과 0 (이미 제거된 web-vite/web-next 등)

## ✅ Definition of Done

- [ ] SSOT 정책 섹션 (CONVENTIONS) 작성
- [ ] 루트 ARCHITECTURE.md thin pointer 화 + index 참조 갱신
- [ ] docs/reference/architecture.md 누락 축 보강
- [ ] drift(카운트/stale 참조) 정정, grep 0
- [ ] `walkthrough.md`/`pr_description.md` ship + 브랜치 push + PR
