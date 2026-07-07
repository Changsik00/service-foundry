refactor(spec-23-06): auth.controller 3분할 (Auth/Session/Org) + 라우트 보존 안전망

## 📋 Summary

### 배경 및 목적
`auth.controller.ts`(639LOC/17라우트)가 인증 코어 + 세션 + org 책임을 혼재 → 관심사별 3 컨트롤러로 분할. 컨트롤러는 단위 테스트가 없고 로컬 e2e 는 DB 부재 → **DB-free 라우트+가드 스냅샷 테스트**로 보존을 검증.

### 주요 변경 사항
- [x] **라우트 보존 안전망**: `route-inventory.test.ts` — 리플렉션(`PATH/METHOD/__guards__`)으로 17 라우트 **+ 가드 조합** 스냅샷. 분할 후 3 컨트롤러 합집합 == 스냅샷.
- [x] **공유 추출**: `auth-controller.shared.ts` — swagger 스키마·`zodPipe`/`getContext`·타입(3 컨트롤러 공통).
- [x] **SessionController**: csrf + sessions×3 (deps CSRF_SECRET·SessionManagementService).
- [x] **OrgController**: org/switch·invite·accept·members (deps Org{Switch,Invite,Members}Service).
- [x] **AuthController** 슬림: 코어 9개(signin/signup/signout/refresh/me/password×2/email×2) + 죽은 DI 제거.
- 모두 `@Controller("auth")` prefix 유지 → **URL 불변**.

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base). F1. F2(account.controller)는 23-07.

## 🎯 Key Review Points
1. **URL·가드 보존** — 라우트+가드 스냅샷 17개 완전 일치(Auth9+Session4+Org4). 핸들러 verbatim 이동.
2. **DI 정합** — typecheck 가 각 컨트롤러의 서비스 주입 누락을 정적 차단.
3. **검증 한계** — 가드 실행/쿠키 런타임은 CI e2e(auth.e2e) 의존(로컬 e2e DB 부재). 스냅샷은 가드 *구성* 보존까지 검증.

## 🧪 Verification
```bash
pnpm vitest run apps/api/src/auth/route-inventory.test.ts   # 17 라우트+가드 보존
pnpm turbo run typecheck lint --filter=./apps/api           # green
grep -cE "@(Get|Post|Delete)\(" apps/api/src/auth/{auth,session,org}.controller.ts  # 9/4/4 = 17
```

## 📦 Files Changed
### 🆕 New
- `apps/api/src/auth/route-inventory.test.ts`, `auth-controller.shared.ts`, `session.controller.ts`, `org.controller.ts`
### 🛠 Modified
- `apps/api/src/auth/auth.controller.ts`: 코어 9 라우트만 + DI 정리
- `apps/api/src/auth/auth.module.ts`: Session/Org 컨트롤러 등록

## ✅ Definition of Done
- [x] 라우트+가드 스냅샷 17 보존
- [x] 3 컨트롤러 분할 + 모듈 등록, typecheck/lint 그린
- [x] ship + push

## 🔗 관련 자료
- phase-23 · 후속: 23-07(account.controller F2)
