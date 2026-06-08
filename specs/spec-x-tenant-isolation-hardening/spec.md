# spec-x-tenant-isolation-hardening: 테넌트 격리 하드닝 (쓰기 강제 + 슈퍼유저 가드)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-tenant-isolation-hardening` |
| **타입** | Fix (security hardening) |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-08 |
| **소유자** | dennis |
| **PR Target** | `main` |

## 📋 배경 및 문제 정의

### 현재 상황

phase-17(17-07/08)이 테넌트 읽기 격리를 실 경로에서 실효화했다(ADR-0024). 그러나 회고에서 비차단 잔여 3건이 이월됐다:

- **W-2 쓰기 경로 미강제**: 도메인 테이블 RLS 정책이 `WITH CHECK (true)` — 읽기는 격리되나 인증 컨텍스트 하 INSERT/UPDATE 의 `org_id` 변조가 차단되지 않는다.
- **W-5 슈퍼유저 가드 약함**: `settings.ts` 가드가 `username==="postgres"` 단일 관례명만 검사 — BYPASSRLS/타 슈퍼유저/role 상속을 못 막는다.
- **W-6 이메일 실전송 검증**: (조사 결과) `createResendNotifier` 의 SDK 호출은 이미 단위 테스트로 검증됨(`notification/index.test.ts`). 진짜 live-send 는 실 키·인박스 필요라 자동화 불가 — 에러 경로 보강 + 한계 명시로 마무리.

### 문제점

- 향후 도메인 endpoint(데이터 phase)가 추가되면, 컨텍스트=A 인 요청이 `org_id=B` 로 row 를 쓰는 것을 DB 가 막지 못한다(현재는 노출 endpoint 가 적어 잠재).
- 운영에서 `postgres` 외 슈퍼유저/BYPASSRLS role 로 접속하면 격리가 조용히 우회된다.

### 해결 방안 (요약)

(1) 도메인 테이블 RLS 정책에 **`WITH CHECK (org_id = 컨텍스트)`** 를 적용해 쓰기도 강제하고(정당한 cross-org 쓰기는 `runWithSystemTenant` 의 NULL 컨텍스트로 통과 — 회귀 0), (2) 부팅 시 **`SELECT rolsuper`** DB 확인으로 운영 슈퍼유저 접속을 거부하며, (3) W-6 은 에러 경로 테스트를 보강하고 live-send 한계를 문서화한다.

## 🎯 요구사항

### Functional Requirements
1. 도메인 테이블(organizations·memberships·invitations) RLS 정책의 `WITH CHECK` 가 `app.current_org` 와 `org_id`(organizations 는 `id`) 일치를 강제한다. 컨텍스트 NULL/빈문자열이면 허용(시스템 컨텍스트·무컨텍스트 쓰기 호환).
2. production 부팅 시 런타임 role 이 슈퍼유저(`rolsuper`)면 기동을 거부한다(DB 확인 — username 휴리스틱 대체/보강).
3. W-6: ResendNotifier 의 에러 응답 → throw 경로 테스트 보강. live-send 자동화 불가 한계를 spec/walkthrough 에 명시.

### Non-Functional Requirements
1. 기존 e2e 전체 GREEN — signup(프로비저닝)·invite create/accept·org switch 쓰기 흐름 회귀 0.
2. 쓰기 격리가 실제로 강제됨을 테스트로 증명(컨텍스트=A 가 org_id=B 쓰기 시도 → 거부).
3. 슈퍼유저 가드는 username 휴리스틱이 아닌 DB 사실(rolsuper) 기반.

## 🚫 Out of Scope
- provider 모드(phase-18) 쓰기 경로.
- 운영 풀러(pgbouncer)/풀 사이징.
- 진짜 live email 발송 e2e(실 키·인박스 의존 — 자동화 불가).

## 📑 ADR 후보
- [ ] 없음 — ADR-0024(격리 불변식) 범위 내 강화. WITH CHECK 강제는 0024 의 "읽기까지" 를 "쓰기 포함" 으로 확장하는 후속이므로 ADR-0024 에 한 줄 보강(Status/Consequences) 가능.

## 🔗 관련 문서
- ADR: `docs/adr/0024-tenant-isolation-enforcement.md`
- 회고: `docs/review/2026-06-08-phase-17-review.md` (W-2/W-5/W-6)
- 관련 spec: [[spec-17-08]]

## ✅ Definition of Done
- [ ] 모든 단위 테스트 PASS
- [ ] (Integration Test Required = yes) 쓰기 격리 테스트 PASS + 기존 e2e 전체 GREEN
- [ ] W-2/W-5 해소, W-6 정리(에러경로 + 한계 명시)
- [ ] `walkthrough.md`/`pr_description.md` ship + PR(main) + queue.md specx→done
