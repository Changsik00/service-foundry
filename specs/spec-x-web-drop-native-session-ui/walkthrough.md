# Walkthrough: spec-x-web-drop-native-session-ui

> provider-전용 웹에서 native 전용 세션관리 UI 제거 (로컬 dev 에서 발견된 404 부정합).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 세션 UI 처리 | 모드 게이트 / 제거 | **제거** | `env.ts` 가 SUPABASE 를 **필수**로 요구 → 웹은 provider 전용. native 세션 분기는 영구 dead → 게이트보다 제거가 정직 |
| 범위 | 세션만 / native UI 전수 | **세션만** | 보고된 404 가 세션. password/MFA 등 동일 클래스 점검은 follow-up |

## 💬 사용자 협의

- 사용자: "native 전용이 아니면 session 호출 불필요 — 웹 수정, 데모 예시 잘못됨." → provider 웹에서 native 세션 UI 제거.

## 🧪 검증 결과

- 잔여 참조 0 (주석만 남김 — 의도 설명).
- `turbo run lint typecheck test --filter=@apps/web` → **13/13 PASS**.
- dev 웹(watch) 재컴파일 → 콘솔/계정에서 세션 카드 사라짐 → `/auth/sessions` 호출 자체가 없어져 404 소멸.

## 🔍 발견 사항 / 이월

- 웹은 **Supabase 인증 전용**(env 필수 + http-client `auth: source`). native 전용 기능(세션)은 이 웹에 부적합.
- 잔여 모드 부정합(Icebox): `/auth/orgs`(native 갭) + 동일 클래스 점검(password/MFA/passkey native UI가 provider 웹에 적절한지). native 모드 웹 지원은 별도 큰 작업.
