test(spec-24-01): add controller unit tests as refactor safety net

## 📋 Summary

### 배경 및 목적
phase-24(refactor-hardening-2)의 첫 spec. 이후 컨트롤러 분할(F2, spec-24-03)·패키지 이관(E1/E2, spec-24-04/05)의 **회귀 안전망**으로, 단위 테스트가 없던 `apps/api/src/auth/` 컨트롤러 8개에 동작 가드형 테스트를 추가한다.

사전 조사로 범위를 재정정: phase-23 감사 §G 가 "~11 모듈"로 지목했으나 서비스는 이미 전부 테스트 존재, `jwt.service` 는 패키지 이관됨 → **실제 무테스트는 컨트롤러 8개뿐**.

### 주요 변경 사항
- [x] account / session / org / provider-org / passkey / mfa / oauth / provider-me 컨트롤러 단위 테스트 신규 (각 위임 인자 + 검증/거부 분기)
- [x] `route-inventory.test.ts` 에 누락 컨트롤러 6개(22 라우트+가드) 스냅샷 보강 — 분할 전 라우트·가드 보존 계약 확보
- [x] 기존 코드 무변경(characterization) — 회귀 0

### Phase 컨텍스트
- **Phase**: `phase-24`
- **본 SPEC 의 역할**: 후속 분할/이관 작업의 회귀 안전망 선결

## 🎯 Key Review Points

1. **테스트 독립성(Wb 교훈)**: 신구현 거울이 아니라 "이 라우트 → 이 서비스 메서드 → 이 인자 / 이 검증은 거부"를 검증. 코드 변경 없이 그린.
2. **route-inventory 확장**: `DELETE /auth/account//` 의 이중 슬래시는 `@Delete()` 빈 경로 리플렉션 산물 — 의도적으로 스냅샷에 고정(주석 명시).
3. **@OrgRoles 메타 보존**: org 초대(admin/owner) role 메타는 route-inventory 가 가드.

## 🧪 Verification

### 자동 테스트 (단위)
```bash
cd apps/api && npx vitest run --exclude '**/*.e2e.test.ts'
```
**결과 요약**: ✅ 243 tests / 48 files (신규 컨트롤러 8 + route-inventory 포함)

### 통합 테스트 (e2e)
```bash
# CI(verify.yml) 동일: postgres:16 @5434 + app_runtime role + db:migrate
npx vitest run e2e.test
```
✅ 95 tests / 12 files (회귀 0)

> 참고: 로컬에서 e2e 는 5434 테스트 DB 가 있어야 한다(없으면 signup 500). PR 검증 권위는 CI `verify.yml`. **머지 전 CI 그린 필수.**

## 📦 Files Changed

### 🆕 New Files
- `apps/api/src/auth/account.controller.test.ts`
- `apps/api/src/auth/session.controller.test.ts`
- `apps/api/src/auth/org.controller.test.ts`
- `apps/api/src/auth/provider-org.controller.test.ts`
- `apps/api/src/auth/passkey.controller.test.ts`
- `apps/api/src/auth/mfa.controller.test.ts`
- `apps/api/src/auth/oauth.controller.test.ts`
- `apps/api/src/auth/provider-me.controller.test.ts`

### 🛠 Modified Files
- `apps/api/src/auth/route-inventory.test.ts`: 누락 컨트롤러 6개 라우트+가드 스냅샷 보강

**Total**: 9 files changed (+test only)

## ✅ Definition of Done

- [x] 무테스트 컨트롤러 8개 단위 테스트 추가, 전부 PASS
- [x] route-inventory 스냅샷 보강 및 PASS
- [x] 단위/통합 테스트 + lint/typecheck 통과 (회귀 0)
- [x] `walkthrough.md` / `pr_description.md` ship commit
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-24.md`
- Walkthrough: `specs/spec-24-01-controller-test-net/walkthrough.md`
