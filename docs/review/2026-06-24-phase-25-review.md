# phase-25 (refactor-hardening-3) 회고 — 독립 감사

> 2026-06-24. `/hk-phase-review` 단일 독립 서브에이전트(소규모 phase). 채택 2 spec(25-01·25-02) + D2/D4 드롭 + E3/E4 이월.

## 결론
**Critical 0 — 견고.** 감사자가 DI smoke 효력을 실증(미등록 provider 프로브로 `.compile()` reject 확인), D6 동작 보존을 분기별로 검증. 드롭/이월은 작업회피가 아닌 substance 검증 근거의 건전한 right-size.

## 🟡 Warning + 조치
| # | 문제 | 조치 |
|---|---|---|
| W1 | 가드 순서 검증이 현재 latent(전 가드 알파벳순 → `.sort()` 제거가 스냅샷 0변화). 성공기준 문구 과장 | ✅ phase.md #1 "현재 latent·미래 reorder 대비" 로 정직화 (커밋 e924744) |
| W2 | `checkRoles` 직접 단위테스트 부재(guard 경유 간접만) | ✅ `roles-guard.util.test.ts` 6 케이스 추가 (fail-open·일치·불일치·user부재·null) |
| W3 | route-inventory 17/22 하드코딩 brittle 미해소 (Out of scope 였음) | ⏭ Icebox(route-inventory Wd 항목) — DI smoke `moduleRef` 에서 라우트 추출해 동적 대조하는 안 제안 |

## 📊 성공기준
- #1 Wd: DI smoke=진짜 가드(실증) ✅ / 가드순서=잠재가치(정직화). #2 D6 dedup ✅. 드롭(D2/D4)·이월(E3/E4) 정당 ✅. #4 회귀 0 (151/151) ✅.

## 💡 KIT
- **Keep**: DI smoke(무-DB 9ms 고ROI)·per-item 드롭 규율·공유함수(클래스팩토리 대신 DI 메타 보존).
- **Improve**: 성공기준 문구의 현재가치 정직성(반영함).
- **Try**: route-inventory EXPECTED 를 DI smoke moduleRef 에서 동적 추출(brittle 근본 해소) — 차기 phase.

## 🔗 관련
- spec-25-01(#182), spec-25-02(#183), phase PR #184. phase-23 §Wd.
