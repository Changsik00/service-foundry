# Walkthrough: spec-10-03

> tooling 스크립트 번들 — manifest / startup-report / config-graph + security-linter 결정.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| spec 구성 | 개별 / 번들 | **번들 (10-03+04+05+07)** | 소형 작업 4건 — ceremony 3→1 절감 (§11.4, 사용자 "공격적 번들") |
| maskConfig 위치 | tooling/scripts / 패키지 | **`@repo/backend-settings`** | apps/api 가 부트 시 import — tooling 은 앱이 import 불가(boundary). settings 가 적집 |
| service.yaml depends | 인프라 포함 / 앱 간만 | **앱 간 의존만** | 인프라(postgres/redis)는 compose 소관. validator 는 manifest 간 참조만 검증 |
| config-graph 범위 | 풀 dep 그래프 / 필드 트리 | **필드 트리** | settings 스키마 필드 → mermaid. 풀 dep 그래프는 Out of Scope |
| config-graph introspect | 직접 zod reflection / introspectEnvSchema | **introspectEnvSchema** | `@repo/backend-settings` 가 re-export, `{key,type,required,secret}` 반환 — 견고 |
| 보안 linter | semgrep / socket / 없음 | **No-Go (ADR-0019)** | CI 부재(phase-11)로 강제력 0, 범위 폭주 방지. phase-11 재평가 |
| console 사용 | log / info | **console.info** | repo biome `noConsole` 가 error/warn/info 허용, log 만 경고 |

### ADR 승격 가이드
- [x] ADR 승격 대상 있음 → 작성됨: `docs/adr/0019-security-linter.md`
- [ ] 없음

## 💬 사용자 협의

- **주제**: 진행 속도 (sdd ceremony 부담)
  - **합의**: 남은 phase-10 소형 spec 을 공격적으로 번들 → spec-10-03 에 4건 통합, 10-06(observability)만 별도

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm exec vitest run tooling/scripts` + `pnpm --filter @repo/backend-settings test`
- **결과**: ✅ tooling/scripts 10 passed (validateManifests 5 + toMermaid 5) / backend-settings 11 passed (mask 5 + 기존 6)

#### 통합 테스트
- **명령**: `bash tooling/scripts/smoke-test.sh`
- **결과**: ✅ Passed
```text
✓ tooling:manifest — service.yaml 검증 통과
✓ tooling:config-graph — mermaid flowchart 출력
✓ tooling 스크립트 스모크 테스트 통과
```

### 2. 수동 검증
1. `pnpm tooling:manifest` → service.yaml 3건 검증 0 error
2. `pnpm tooling:config-graph` → BaseBackendSchema mermaid flowchart 출력
3. `maskConfig` — DATABASE_URL / *SECRET* 마스킹, 시크릿 평문 미노출 (단위 테스트로 강제)

## 🔍 발견 사항

- **boundary 교정**: startup-report 의 maskConfig 를 처음 tooling/scripts 에 두려 했으나, apps/api 가 부트 시 써야 해 `@repo/backend-settings` 로 이전 (apps → tooling import 는 layering 위반).
- **introspectEnvSchema 재사용**: `@env-kit/node-settings` 의 introspect 결과(`{key,type,required,secret,enumValues}`)가 config-graph 입력에 그대로 맞아 zod 직접 reflection 회피.

## 🚧 이월 항목

- **auth observability**(prometheus/grafana/alert) → spec-10-06 (별도, 마지막).
- **`pnpm new app`** → 별도 후속 spec.
- 보안 linter → phase-11(CI) 재평가 (ADR-0019).

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md` (§성공 기준 3·4·5)
- 관련 ADR: `docs/adr/0019-security-linter.md`, ADR-0003
- 직전 spec: `spec-10-02` (tooling-generators)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-30 |
| **최종 commit** | ship 시 갱신 |
