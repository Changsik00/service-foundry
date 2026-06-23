fix(spec-x-null-org-isolation-failclose): fail-close RLS for authenticated null-org tokens

## 📋 Summary

### 배경 및 목적
phase-24 회고 보안 패널이 발견·재현한 **cross-tenant 데이터 누수** hotfix. 인증됐지만 `orgId=null` 인 토큰(OAuth 로그인 또는 org 미설정 사용자 — 위조 아닌 정상 발급)이 `GET /auth/org/members`(native+provider, AuthGuard-only) 호출 시 RLS NULL 컨텍스트 = 퍼미시브로 **전 테넌트 멤버십+이메일 노출**. (로컬 재현: 66 org 가시.)

### 주요 변경 사항
- [x] **interceptor fail-close**: `req.user` 존재(인증)인데 `orgId` 없으면 **불가능 컨텍스트(nil-uuid)로 tx+SET LOCAL** → RLS 가 전 org-scoped 행 차단. 미인증(`req.user` 없음)은 permissive 유지(bootstrap).
- [x] systemic — org-scoped 모든 RLS-only 엔드포인트가 한 곳 수정으로 보호.
- [x] 단위 3분기 테스트 + **null-org e2e**(앱 keystore 로 OAuth 동형 토큰 서명 → 0건 검증).
- [x] ADR-0024 에 fail-close 불변식(#7) 추가 + 이관(spec-24-05) stale 경로 정정.

### 타입
- **Fix (보안)** · spec-x (solo, target main)

## 🎯 Key Review Points

1. **fail-close 경계**: 미인증=permissive(bootstrap 필요), 인증+null=fail-closed. `req.user` 유무로 구분.
2. **정당 무-org 흐름 무영향**: 내 org 목록·전환·초대수락은 `runWithSystemTenant`(system 컨텍스트 토글) 경유 → nil 컨텍스트와 무관. e2e 회귀 0.
3. **검증 2단계(/hk-refute) 통과**: Opus 독립 적대검증 Go. nil-uuid org DB 부재 실측, 잔여 raw-pool 경로는 명시 WHERE 로 안전.

## 🧪 Verification

```bash
turbo run lint typecheck test          # 로컬 5434 DB → 151/151
npx vitest --root apps/api run tenant-isolation.http   # null-org 0건 포함
```
**결과**: ✅ 151/151 task. nestjs-tenant 단위 3 + null-org e2e + 격리 회귀 0.

## 📦 Files Changed

### 🛠 Modified
- `packages/nestjs/tenant/src/index.ts` (fail-close 분기)
- `packages/nestjs/tenant/src/index.test.ts` (3분기 단위)
- `apps/api/src/auth/tenant-isolation.http.e2e.test.ts` (null-org 누수 차단 e2e)
- `docs/adr/0024-tenant-isolation-enforcement.md` (불변식 #7 + stale 경로 정정)

## ✅ Definition of Done

- [x] interceptor fail-close, 미인증 permissive 유지
- [x] 단위 3분기 + null-org e2e + 격리 회귀 0
- [x] lint/typecheck/test PASS
- [x] /hk-refute(검증 2단계) Go
- [x] ADR-0024 보강

## 🔗 관련 자료
- ADR-0024 (tenant isolation), phase-24 회고 보안 패널
- [[feedback_isolation_test_real_path]]
