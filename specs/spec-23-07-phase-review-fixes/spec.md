# spec-23-07: phase-23 회고 결함 수정 (review-fixes)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-07` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-07-phase-review-fixes` |
| **상태** | Planning |
| **타입** | Fix |
| **작성일** | 2026-06-19 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
`/hk-phase-review` 독립 4-패널 회고가 phase-23 종료 전 **실제 결함 2건(C1·C2) + 장부 정합성(C3) + 테스트 무결성 약점**을 발견. 메인 세션 self-review 가 놓친 것. NO-GO 결정 → 닫고 phase 마감.

### 문제점 (회고에서 실측 확인)
- **C1 AppErrorFilter 무방비**: `res.status(exception.statusCode)` 에 (a) status 가드 없음 — http-client NETWORK 에러 `statusCode:0` → `res.status(0)` 크래시, (b) 5xx AppError 의 내부 `message`/`details` 그대로 노출(정보 노출). (`app-error.filter.ts:14`)
- **C2 23-06 안전망 구멍**: `OrgRolesGuard` 는 **fail-open**(`@OrgRoles` 없으면 `return true`)인데 `route-inventory.test` 는 가드 *클래스*만 스냅샷, **`@OrgRoles` 메타 미검증** → 권한 라우트(`org/invite`)에서 데코 누락 회귀를 못 잡음.
- **C3 장부**: phase-23.md 상태/Done/검증결과 미작성, queue.md 오류 날짜, 이월(A5/B2/D2-D6/F2) Icebox 미승격(휘발), 인벤토리 완료 미표시.
- **테스트 무결성**: JWKS 메모이즈 테스트가 메모이즈 미검증(kid 동등은 캐시 없이도 통과), MFA `verifyMfa` 의 backup-code 소모/잘못된코드 reject 경로 미커버.

### 해결 방안
C1 필터 하드닝(+테스트), C2 라우트-인벤토리에 `@OrgRoles` 메타 단언, 테스트 무결성 2건 보강, C3 장부 정직 정리. 그 후 phase-ship.

## 요구사항
1. C1: AppErrorFilter — statusCode 400~599 외 → 500 클램프, **5xx 는 message 일반화 + details 제거**(4xx 는 유지). 필터 테스트 보강.
2. C2: `route-inventory.test` — `org/invite` 의 `ORG_ROLES_KEY` 메타(`["admin","owner"]`) 스냅샷에 포함.
3. 테스트 무결성: jwt.service 메모이즈를 `toJwks` 호출 횟수 spy 로 단언, mfa `verifyMfa` reject(잘못된 TOTP+backup)·backup 소모 경로 테스트.
4. C3: queue.md 이월 Icebox 승격 + 인벤토리 완료표시, phase-23.md 상태/Done/검증결과/성공기준(△ 정직) 작성.

## Out of Scope
- 컨트롤러 단위 테스트 전면(F1 잔여)·로컬 e2e DB setup·Serena 일관 적용 — 다음 phase/후속(Icebox).
- A5/B2/F2 등 기능 이월 — Icebox 승격만(실행은 후속).

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [x] NO-GO: 회고 결함 모두 수정 후 phase done (사용자 결정).
> - [ ] C1 의 5xx 새니타이즈는 **응답 형태 변경**(내부 message→"Internal error") — 의도된 보안 개선.

## 핵심 전략
| 결함 | 수정 | 검증 |
|:---:|:---|:---|
| C1 | 필터 status 클램프 + 5xx 새니타이즈 | 필터 단위테스트(0·5xx·4xx) |
| C2 | route-inventory 에 @OrgRoles 메타 포함 | 스냅샷 == 17(+org/invite 메타) |
| 테스트 무결성 | JWKS spy / MFA verifyMfa | 호출횟수·reject 분기 |
| C3 | 장부 정리 | grep/육안 |

## Proposed Changes
#### [MODIFY] `apps/api/src/infra/app-error.filter.ts` (+test)
status 400~599 클램프, 5xx message 일반화 + details 제거.
#### [MODIFY] `apps/api/src/auth/route-inventory.test.ts`
`ORG_ROLES_KEY`(="org_roles") 메타를 라우트 시그니처에 포함, org/invite 기대값에 반영.
#### [MODIFY] `apps/api/src/jwt/jwt.service.test.ts`
`toJwks` spy 로 반복 호출 시 1회만 계산(메모이즈) 단언.
#### [MODIFY] `apps/api/src/auth/mfa.service.test.ts`
`verifyMfa`: 유효 challenge + 잘못된 TOTP·backup → reject, 유효 backup → 소모(updateEnabled) 테스트.
#### [MODIFY] `backlog/queue.md` · `backlog/phase-23.md`
이월 Icebox 승격 + 인벤토리 완료표시 + phase 종료 장부.

## 검증 계획
```bash
pnpm vitest run apps/api/src/infra/app-error.filter.test.ts apps/api/src/auth/route-inventory.test.ts \
  apps/api/src/jwt/jwt.service.test.ts apps/api/src/auth/mfa.service.test.ts
pnpm turbo run typecheck --filter=./apps/api
```

## ADR 후보
- [ ] C1 5xx 새니타이즈를 ADR-0027 에 1줄 추가(필터가 5xx 내부정보 미노출) — **경량 갱신** 검토.
- [x] 신규 ADR 불필요.

## ✅ Definition of Done
- [ ] C1/C2 코드+테스트 그린, 테스트 무결성 2건 추가
- [ ] C3 장부 정리(이월 Icebox·인벤토리·phase 종료 기록)
- [ ] `apps/api` typecheck 그린
- [ ] walkthrough/pr_description ship + push
