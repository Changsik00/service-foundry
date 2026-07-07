# spec-23-01: 보안 크리티컬 테스트 안전망

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-01` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-01-test-safety-net` |
| **상태** | Planning |
| **타입** | Test |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
리팩토링 감사 G(테스트 부채)에서 보안/핫패스 모듈 다수가 단위 테스트가 없음을 확인. phase-23 의 다음 spec(23-02 핫패스 수정)은 이 모듈들의 동작을 바꾸므로, **변경 전 회귀 안전망**이 필요하다.

### 문제점 (단위 테스트 공백 — 실측 확인)
- `auth/account.stores.ts` — `isSoleOwnerOfAnyOrg` (23-02 A1 N+1 수정 대상) **단위 테스트 ✗**
- `jwt/jwt.service.ts` — `toJwks`/`getJwks` (23-02 A3 메모이즈 대상) **✗**
- `auth/mfa.service.ts` — TOTP enroll/verify/backup (보안 크리티컬) **✗**
- `auth/oauth.service.ts` — code 교환·provider 매핑·에러 (보안 크리티컬) **✗**

> api-key·org-list·signin·passkey.service 는 이미 단위 테스트 보유 → 범위 제외.

### 해결 방안
위 4개 모듈에 **현재 동작을 고정하는 characterization 단위 테스트**를 추가한다. 본 spec 은 **테스트만 추가**(production 코드 변경 0)하여 23-02 의 동작 변경을 안전하게 가드한다.

## 요구사항

1. `account.stores.ts` `isSoleOwnerOfAnyOrg` — sole owner / 다른 owner 존재 / 다른 member 존재 / 멤버십 없음 분기 검증 (23-02 A1 가드).
2. `jwt.service.ts` `toJwks`/`getJwks` — 활성 공개키 → JWKS 형태, kid 포함, 빈 keystore 처리 (23-02 A3 가드).
3. `mfa.service.ts` — TOTP enroll(secret 생성)·verify(유효/무효 코드)·backup code 소비 경로.
4. `oauth.service.ts` — provider별 clientId/userInfo 매핑·미지원 provider 에러.

## Out of Scope

- production 코드 변경 (23-02 이후). 본 spec 은 테스트 전용.
- 나머지 G 모듈(account/passkey/mfa.controller 등 컨트롤러) — e2e 로 흐름 커버됨, 핫패스 비대상이라 후순위.
- e2e DB 의존 신규 테스트 — 단위(mock store) 우선. 격리 검증은 기존 e2e(spec-17-08) 유지.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 테스트 전용 spec — 4개 모듈 characterization. 23-02 선결.

## 핵심 전략

| 모듈 | 테스트 방식 | 가드 대상 |
|:---:|:---|:---|
| account.stores | mock db, 분기별 쿼리 결과 주입 | 23-02 A1 N+1 |
| jwt.service | `createInMemoryKeyStore` 실 keystore | 23-02 A3 캐시 |
| mfa.service | otplib 실/모킹, store mock | 보안 회귀 |
| oauth.service | env/provider mock, undici 응답 mock | 보안 회귀 |

## Proposed Changes

#### [NEW] `apps/api/src/auth/account.stores.test.ts`
#### [NEW] `apps/api/src/jwt/jwt.service.test.ts`
#### [NEW] `apps/api/src/auth/mfa.service.test.ts`
#### [NEW] `apps/api/src/auth/oauth.service.test.ts`

> 모든 테스트는 **현재 동작 그대로**를 단언(characterization). 동작 변경 없음.

## 검증 계획

```bash
pnpm vitest run apps/api/src/auth/account.stores.test.ts \
  apps/api/src/jwt/jwt.service.test.ts \
  apps/api/src/auth/mfa.service.test.ts \
  apps/api/src/auth/oauth.service.test.ts   # 신규 4 파일 그린
pnpm turbo run typecheck --filter=./apps/api  # 그린
```

수동 검증:
1. 4개 테스트 파일 추가 후 전체 단위 스위트 그린 유지.
2. (23-02 착수 시) 본 테스트가 핫패스 변경을 가드.

## ADR 후보
- [x] 없음 — 테스트 추가, 결정 없음.

## ✅ Definition of Done

- [ ] 4개 모듈 단위 테스트 추가·통과
- [ ] `apps/api` typecheck 그린
- [ ] production 코드 변경 0 (diff 가 테스트/산출물만)
- [ ] walkthrough/pr_description ship + push
