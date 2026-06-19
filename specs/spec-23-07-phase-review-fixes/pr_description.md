docs(spec-23-07): phase-23 회고 결함 수정 (review-fixes)

## 📋 Summary

### 배경 및 목적
`/hk-phase-review` 독립 4-패널 회고가 phase-23 종료 전 **실결함 2건 + 테스트 무결성 약점 + 장부 정합성**을 발견(메인 세션 self-review 가 놓침). NO-GO 결정 → 닫고 phase 마감.

### 주요 변경 사항
- [x] **C1 AppErrorFilter 하드닝** — `statusCode` 400~599 외(예: http-client NETWORK `0`) → **500 클램프**, **5xx 는 내부 message 일반화("Internal error") + details 제거**(4xx 유지). 정보 노출/`res.status(0)` 크래시 차단.
- [x] **C2 route-inventory @OrgRoles 메타 단언** — `OrgRolesGuard` 는 메타 없으면 **fail-open** → 가드 클래스 스냅샷만으론 `org/invite` 권한 회귀를 못 잡음. `@OrgRoles(["admin","owner"])` 메타를 스냅샷에 포함.
- [x] **테스트 무결성**: JWKS 메모이즈를 `toJwks` spy(호출 1회)로 **실검증**(기존엔 캐시 없이도 통과), MFA `verifyMfa` 의 잘못된 TOTP+backup→reject·유효 backup→소모(updateEnabled) 추가.
- [x] **C3 장부**: queue.md 이월(A5/B2/D2-D6/F2/G/로컬e2e/Serena) Icebox 승격 + 인벤토리 완료표시, phase-23.md 검증 결과·성공기준 **△ 정직** 기록.

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base). 회고 remediation → 이후 `/hk-phase-ship`.

## 🎯 Key Review Points
1. **agent 주장 직접 검증 후 수정** — C1(statusCode:0)·C2(fail-open) 코드 실측 확인. agent 가 말한 일부 항목(queue "completed 2026-06-13")은 실재 안 해 반영 안 함.
2. C1 5xx 새니타이즈 = **응답 형태 변경**(내부 message→generic) — 의도된 보안 개선.
3. C2 는 23-06 안전망의 구멍을 닫음(권한 라우트 fail-open 회귀 가드).

## 🧪 Verification
```bash
pnpm vitest run apps/api/src/infra/app-error.filter.test.ts apps/api/src/auth/route-inventory.test.ts \
  apps/api/src/jwt/jwt.service.test.ts apps/api/src/auth/mfa.service.test.ts   # 17 passed
pnpm turbo run typecheck --filter=./apps/api   # green
```

## 📦 Files Changed
- `apps/api/src/infra/app-error.filter.ts` (+test): status 클램프 + 5xx 새니타이즈
- `apps/api/src/auth/route-inventory.test.ts`: @OrgRoles 메타 단언
- `apps/api/src/jwt/jwt.service.test.ts`: 메모이즈 spy
- `apps/api/src/auth/mfa.service.test.ts`: verifyMfa 분기
- `backlog/{queue,phase-23}.md`: 장부 정합성

## ✅ Definition of Done
- [x] C1/C2 코드+테스트 그린, 테스트 무결성 2건 추가
- [x] C3 장부 정리
- [x] `apps/api` typecheck 그린
- [x] ship + push

## 🔗 관련 자료
- /hk-phase-review 회고(4-패널) · phase-23 · 다음: /hk-phase-ship
