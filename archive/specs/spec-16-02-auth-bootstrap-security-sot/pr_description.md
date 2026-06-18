fix(spec-16-02): absorb applySecurity into configureApp SoT

## 📋 Summary

### 배경 및 목적
phase-15 C1 에서 미들웨어 배선을 `configureApp` SoT 로 추출했으나 `applySecurity`(helmet/CORS)는 main.ts 에 남아 e2e 밖이었다 — 제거해도 GREEN(phase-15 2차회고 V1, C1 과 동일 계열 갭). 본 spec 은 applySecurity 를 configureApp 에 흡수해 보안헤더 배선까지 회귀 안전망에 넣는다.

### 주요 변경 사항
- [x] `configureApp(app, opts?: { corsOrigin })` 로 확장 — requestId + cookieParser + applySecurity(helmet/cors) 단일 경로
- [x] main.ts: 인라인 `applySecurity` 제거, `configureApp(app, { corsOrigin: settings.CORS_ORIGIN })`
- [x] e2e: helmet 헤더(`x-content-type-options: nosniff`) 검증 신규

### Phase 컨텍스트
- **Phase**: `phase-16` (Security Hardening II) — 성공기준2 충족
- **역할**: phase-15 2차회고 V1 해소. C1 배선 안전망을 보안헤더까지 확장.

## 🎯 Key Review Points
1. **configureApp 시그니처 변경** `app` → `app, opts?:{corsOrigin}`. e2e 는 opts 생략(cors origin undefined = 허용), main.ts 가 settings 주입.
2. **배선 순서**: requestId → cookieParser → applySecurity (생성 직후, useLogger 와 무관).

## 🧪 Verification
```bash
DATABASE_URL=postgres://postgres:test@localhost:5434/test pnpm --filter @apps/api test
pnpm turbo run lint typecheck test knip depcruise
```
**결과**:
- ✅ `apps/api` 105/105 PASS (+1 helmet)
- ✅ 게이트 136/136
- ✅ 부정 검증: configureApp 에서 applySecurity 제거 → helmet e2e FAIL (배선 회귀 차단)

## 📦 Files Changed

### 🛠 Modified Files
- `apps/api/src/app.setup.ts` (+9, -2): configureApp 에 applySecurity + ConfigureAppOptions
- `apps/api/src/main.ts` (+1, -6): 인라인 applySecurity 제거, corsOrigin 주입
- `apps/api/src/auth/auth.e2e.test.ts` (+7): helmet 헤더 검증

**Total**: 3 files

## ✅ Definition of Done
- [x] configureApp 가 applySecurity 흡수, main.ts corsOrigin 주입
- [x] e2e helmet 헤더 검증 (제거 시 FAIL 대조 확인)
- [x] walkthrough/pr_description ship
- [x] lint/typecheck 통과
- [x] 사용자 검토 알림

## 🔗 관련 자료
- Phase: `backlog/phase-16.md`
- 선행: spec-15-04(C1 configureApp 도입), RCA-003
