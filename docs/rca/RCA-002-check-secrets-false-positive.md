---
id: RCA-002
type: failure-pattern
date: 2026-06-01
severity: medium
status: active
---

# RCA-002: check-secrets 훅이 문서 예시·compose 보간을 시크릿으로 오탐

## 🔍 Symptom

`pre-commit` 의 `check-secrets` 훅이 실제 하드코딩 시크릿이 아닌 텍스트를 `password=`/`secret=`/`api_key=` 할당으로 오탐하여 커밋을 block 한다.

```
❌ [hook:block] 시크릿/토큰 패턴 감지 — 커밋 전 확인 필요
     시크릿 할당 패턴 발견 (password=, secret=, api_key= 등)
```

## 🔁 Reproduction

```bash
printf '예시: password=changeme 는 금지\n' > docs/example.md
git add docs/example.md
git commit -m "docs: example"     # → check-secrets 가 block
```
compose 의 `${DB_PASSWORD:-postgres}` 기본값 보간을 커밋해도 동일하게 차단된다.

발생 이력 (≥2회 → RCA trigger):
- **spec-10-06** — docker compose `${POSTGRES_PASSWORD:-postgres}` 보간.
- **spec-14-07 (2026-06-01)** — explainer/reference/README/walkthrough 등 `docs/**/*.md` 의 설명용 예시(`password=`, `secret=`) 로 **다수 문서 커밋이 연쇄 차단**.

## 🎯 Root Cause

`check-secrets.sh` 정규식 `(password|secret|api_key|...)[[:space:]]*[=:][[:space:]]*<값>` 이 **할당 텍스트의 문맥을 구분하지 못한다**: `${VAR:-default}` 셸 기본값 보간, 마크다운 본문/코드펜스 안의 설명용 예시, placeholder 값이 실제 자격증명 하드코딩과 동일하게 매치된다. 파일 종류(`docs/**`, compose) 별 예외도 없다.

## 🛡 Invariant Violated

> 보안 가드는 **실제 위험(하드코딩된 자격증명)** 만 차단하고 정상 산출물(문서/기본값 보간)은 통과시켜야 한다 (낮은 false-positive).

오탐이 잦으면 개발자가 가드를 상시 `warn` 우회하게 되어 **가드의 실효성이 무너진다**(alert fatigue).

## 🚧 Prevention

- **단기(현행 우회)**: 해당 커밋만 `HARNESS_HOOK_MODE_SECRETS=warn git commit ...`. (spec-10-06·spec-14-07 적용)
- **근본(harness-kit `check-secrets.sh`, 로컬 영역)**:
  1. `docs/**`·`*.md` 기본 제외(또는 코드펜스/인라인코드 내부 제외).
  2. `${...:-default}` 보간 패턴 제외.
  3. 명백한 placeholder(`changeme`, `xxx`, `<...>`) 무시.
- harness-kit 훅은 사용자 로컬 관리 영역이므로 본 RCA 는 *패턴 기록*, 실제 수정은 kit 측 반영.

## 🔗 Related

- [[RCA-001-lefthook-typecheck-non-blocking|RCA-001]] — lefthook 게이트 계열
- 메모리: `secrets-guard-compose-env`
- 트리거: spec-10-06, spec-14-07 (다수 커밋 차단)
- 코드: `.harness-kit/hooks/check-secrets.sh`
