# feat(spec-x-proactive-token-rotation): auto-refresh access token before expiry

## 📋 Summary

### 배경 및 목적
액세스 토큰 TTL 15분. 현재 갱신은 reactive(401 후 재시도)만 있어 사용자가 만료 시 끊김을 겪는다. accessToken JWT 의 `exp` 를 디코드해 **만료 60초 전 자동 refresh** 하는 선제 타이머를 `AuthProvider` 에 추가. 백엔드/contract 변경 없이 프론트엔드만으로 구현.

### 주요 변경 사항
- [x] `decodeJwtExp` 유틸 (apps/web) — JWT exp(sec)→ms, 파싱 실패 null
- [x] `CoreAuthSDK.getAccessTokenExpiresAt?()` optional 계약 (auth-contracts)
- [x] `auth-sdk.ts` — sign/refresh accessToken 디코드 → 만료 추적
- [x] `AuthProvider` — exp-margin 선제 refresh 타이머 + 재스케줄 + 탭 재포커스(visibilitychange) 갱신

## 🎯 Key Review Points
1. **백엔드 무변경**: accessToken 이 응답 body 에 이미 있어 클라가 exp 디코드 (서버 expiresAt 필드 불필요).
2. **provider 모드 회귀 0**: `getAccessTokenExpiresAt` optional → firebase/supabase(자체 갱신)는 타이머 비활성.
3. **탭 재포커스**: visibilitychange 시 schedule 재평가 → 백그라운드 만료 탭 즉시 회복.
4. ⚠️ 서명 검증 아님(스케줄링용 claim 파싱). 토큰 신뢰는 서버 verify 담당.

## 🧪 Verification
```bash
turbo run lint typecheck                                  # 96/96
turbo run test --filter=@repo/auth-contracts --filter=@repo/frontend-auth-react --filter=@apps/web
```
- decodeJwtExp(5), auth-sdk expiry(3), AuthProvider 타이머/재스케줄/provider-비활성/탭재포커스(4, fake timers) 통과.

## 📦 Files Changed
- `packages/shared/auth-contracts/src/index.ts`: optional `getAccessTokenExpiresAt`
- `apps/web/src/lib/jwt.ts`(+test): exp 디코드
- `apps/web/src/lib/auth-sdk.ts`(+test): 만료 추적
- `packages/frontend/auth-react/src/provider.tsx`(+test): 선제 타이머 + visibility

## ✅ Definition of Done
- [x] decode/SDK/provider/visibility 구현 + 단위 테스트
- [x] provider 모드 회귀 없음
- [x] lint/typecheck/test 통과
- [ ] PR CI 그린
