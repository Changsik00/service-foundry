test(spec-26-07): no-internal-uuid leak audit (invariant safety net)

## 📋 Summary

### 배경 및 목적
phase-26 마지막 spec. 26-02~06 으로 4개 root(users·org·sessions·api-keys)가 public_id 로 전환됐다. ADR-0028 §1 불변식("응답 body 에 내부 uuid 0")을 **자동 테스트로 강제** — 향후 신규 엔드포인트 회귀를 즉시 RED 로 잡는다.

### 주요 변경 사항
- [x] [NEW] 누출 감사 e2e — 주요 인증 엔드포인트 응답 body 를 hex uuid 정규식으로 스캔, **0건** 단언 + prefix sanity
- [x] 검증 결과 **GREEN (누출 0)** — 모든 root 가 닫혔음을 전수 실증. 수정 불필요.

### 타입
- **Test (불변식 안전망)** · spec-26-07 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **스캔 범위 = 응답 body hex uuid** (§1 실제 강제 경계). JWT payload(§1 예외)·base64 cursor(불투명)·`slug`(개인 org uuid handle, PK 아님)는 제외 — 정규식 자연 미매칭 + slug scrub.
2. **prefix sanity 병행**: id 가 `usr_`/`org_`/`key_`/`ses_` 형식임도 단언 → "필드 누락"으로 인한 가짜 통과 방지.
3. admin(orgs/users)도 role 승격 후 스캔 — 커서(base64)는 비대상(한계 명시).

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- 누출 감사 2/2 GREEN (내부 uuid 0).
- 전체 **154/154 tasks**, 회귀 0.

## 📦 Files Changed
- `apps/api/src/auth/public-id-leak-audit.e2e.test.ts` (신규, 검증 전용)

## ✅ Definition of Done
- [x] 누출 스캔 e2e GREEN (응답 uuid 0 + prefix sanity)
- [x] 누출 0 → 수정 불필요
- [x] walkthrough/pr_description

## 🔗 관련
- ADR-0028 §1, spec-26-01~06. **이 PR 머지 후 phase-26 ship 준비 완료.**
