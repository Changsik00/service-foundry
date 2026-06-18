# Walkthrough: spec-x-ci-tooling-cleanup

> tooling 위생 묶음 — knip 힌트 정리 + tooling 테스트 CI 편입.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| knip roundtrip/emit-span | 와일드카드 유지 / per-package | **per-package entry** | cache·queue(roundtrip), observability(emit-span)만 보유 → 와일드카드는 22개에서 no-match 힌트 |
| apps/worker entry | 명시 src/main.ts / 빈 설정 | **빈 설정 `{}`** | knip 이 main.ts 자동 감지 → 명시는 redundant. wildcard 테스트 glob 만 제외 |
| tooling 테스트 실행 | tooling 패키지화 / vitest 직접 | **`npx vitest run tooling`** | 구조 변경 없이 CI 편입 (패키지화는 후속) |

## 💬 사용자 협의
- **주제**: 다음 작업 → 소품 묶음 선택. spec-x 로 진행.

## 🧪 검증 결과
- **knip**: `turbo run knip` → Configuration hints **40 → 0**, unused 회귀 없음.
- **tooling 테스트**: `npx vitest run tooling` → 3 files / 14 tests 통과 (manifest-drift, validate, to-mermaid).
- **verify.yml**: `yaml.parse` 통과.

## 🔍 발견 사항
- Icebox 는 "ignoreDependency 정리"라 했으나 실제 40 힌트는 **entry 패턴 no-match**였음 (roundtrip.ts/emit-span.ts 와일드카드).
- `apps/worker` 도 같은 계열 힌트(테스트 없는 앱에 테스트 glob) → 함께 해소.

## 🚧 이월 항목
- tooling 을 정식 워크스페이스 패키지로 승격 (turbo 통합) → 후속 후보.
