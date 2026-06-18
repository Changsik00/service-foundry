# Walkthrough: spec-23-06-controller-split

> phase-23 F1 — auth.controller(639LOC/17라우트)를 Auth/Session/Org 3 컨트롤러로 분할. DB-free 라우트+가드 스냅샷으로 보존 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 검증 공백(로컬 e2e 부재) | grep / 라우트 메타 테스트 | **라우트+가드 스냅샷 테스트** | DB 없이 리플렉션(`PATH/METHOD/__guards__`)으로 17 라우트 **+ 가드 조합**까지 보존 검증 |
| "1번 강행이 왜 이슈?" (사용자) | — | 세션길이 우려 철회, 가드 갭만 인정→안전망 강화로 해소 | 컨텍스트 길이로 품질 저하 아님. 진짜 갭(가드 미검증)은 스냅샷에 가드 포함해 닫음 |
| 공유 자산 | 복제 / 공유 모듈 | `auth-controller.shared.ts` 추출 | zodPipe 등이 3 그룹 공통 → 단일 출처 |
| Result 키/핸들러 본문 | — | **verbatim 이동** | 동작 보존, 데코레이터/가드 그대로 |

## 💬 사용자 협의
- 사용자 option 2(컨트롤러 분할) 선택 + "1번이 왜 이슈?" 질문 → 세션길이 우려는 과한 자기검열이라 철회, 가드 검증 갭만 안전망 강화로 해소 후 진행.

## 🧪 검증 결과
- **라우트+가드 스냅샷 17개 보존**: Auth(9)+Session(4)+Org(4) 합집합 == 분할 전 스냅샷(가드 포함) 완전 일치.
- `apps/api` typecheck 그린(DI 재배선 정합 정적 보장 — 미주입 서비스 참조 시 컴파일 에러), lint 그린(`@repo/errors` 기존 info 는 미접촉).
- 핸들러 본문·@UseGuards·@Api* 데코레이터 verbatim 이동.
- 런타임(가드 실행·쿠키) 회귀는 CI e2e(auth.e2e)가 PR 에서 포착.

## 🔍 발견 사항
- 639LOC 단일 컨트롤러 = auth 코어(9) + 세션(4) + org(4) 3 책임 혼재. prefix `auth` 동일 유지로 **URL 불변** 분할 가능.
- 공유 swagger 스키마/`zodPipe`/`getContext`/타입이 모듈레벨에 얽혀 있어 `auth-controller.shared.ts` 로 먼저 추출해야 깨끗한 분할 가능.

## 🚧 이월 항목
- **F2 account.controller(277LOC) 분할** → 23-07(후속, 동일 안전망 패턴 적용 가능).
- 다음: phase-23 `/hk-phase-ship` (6 spec 완료) 또는 23-07.
