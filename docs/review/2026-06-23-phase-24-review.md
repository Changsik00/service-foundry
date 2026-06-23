# phase-24 (refactor-hardening-2) 회고 — 독립 3-렌즈 패널

> 2026-06-23. `/hk-phase-review` 독립 서브에이전트 패널(correctness+test / security / process+feedback) 종합. phase-24 는 6 spec(24-01~06) + auto 모드 후반 수행.

## 결론
핵심 목표(테스트 안전망→결함수정→분할→패키지 이관)는 **증거로 달성**(성공기준 5/5, 격리 e2e 6/6, account 188 LOC, 저널 fresh-DB 증명). 그러나 보안 패널이 **phase-24 범위 밖의 실재 cross-tenant 누수**를 DB 로 재현 → 즉시 hotfix(`spec-x-null-org-isolation-failclose`, PR #179 머지)로 차단. 나머지는 docs drift·거버넌스 공백·잔여 부채.

## 🔴 Critical (조치 완료/진행)
| # | 문제 | 조치 |
|---|---|---|
| C1 | **cross-tenant 누수** — 인증+orgId=null 토큰(OAuth/org미설정)이 `GET /auth/org/members`(native+provider)에서 RLS NULL-permissive 로 전 테넌트 멤버·이메일 노출(DB 재현 66 org) | ✅ **해소** — interceptor fail-close(nil-uuid 컨텍스트), null-org e2e, /hk-refute Go. ADR-0024 #7 불변식. spec-x #179 |
| C2 | ADR-0024 가 이관 전 경로(`infra/tenant.*`) 지시 | ✅ **해소** — spec-x 에서 ADR-0024 경로 정정 |
| C3 | drizzle explainer 가 `infra/schema/` 경로 지시 (이관 미반영) | ⏳ 본 정리에서 수정 |
| C4 | auto 모드가 constitution 미정의인 채 cross-cutting/보안(E1/E2)에 사용 (Turbo 는 명시 금지) | ⏳ Icebox 이월 — constitution "Mode E — Auto" 정식화 |

## 🟡 Warning (이월)
| # | 문제 | 이월 |
|---|---|---|
| W1 | phase-24.md 상태 드리프트(Planning·Done 미체크·검증결과 공란) — post-sync 가 phase 본문 누락 | 본 정리에서 수정 |
| W2 | auto 결정이 walkthrough 에만, phase.md Review 표 미승격 | 본 정리에서 반영 |
| W3 | phase-FF 보고 일부 stale — 실제 미착수는 **A5(feature-flag limit) 1건**(B4·knip 은 이미 완료) | Icebox |
| W4 | route-inventory Wd 한계(인스턴스화/DI/순서 미검증) 잔존 | Icebox |
| W5 | 신규 패키지 3종 reference 문서 미작성 | Icebox |
| W6 | **얇은 방어선 3건**(보안 후속) — A: RLS-off 인증테이블(users/sessions/audit) WHERE-only / B: raw-pool 우회 경로(interceptor 밖) / C: org-members 단일 방어선(방어적 WHERE 부재) | Icebox |

## 📊 성공기준 5/5 (실측 재현)
1. ✅ 무테스트 컨트롤러 8개 단위 + route-inventory  2. ✅ Wa/We/Wf  3. ✅ account 188 LOC  4. ✅ 격리 e2e 6/6  5. ✅ 151/151 task

## 👤 피드백 반영
isolation 실경로·drizzle 저널·no-footer·TDD Red·intent-over-structure 준수 ✅. post-sync 부분위반(W1). Serena/secrets-guard 사용여부 미확인.

## 💡 KIT
- **Keep**: 위험완화 순서, 수치 실측 재정정, fresh-DB 마이그레이션 검증, 회고-발견 즉시 hotfix.
- **Improve**: post-sync 를 phase 본문까지, auto 결정 단일 추적처.
- **Try**: constitution Mode E(Auto) 정식화 + "보안/cross-cutting 은 auto 라도 종료 전 독립검증(/hk-refute) 1회".

## 🔗 관련
- spec-x-null-org-isolation-failclose (#179), ADR-0024(#7 불변식), ADR-0027
