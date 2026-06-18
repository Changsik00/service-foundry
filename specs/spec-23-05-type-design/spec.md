# spec-23-05: 타입 설계 강화 (role enum + OAuthUserInfo union)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-05` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-05-type-design` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
phase-23 F(복잡도/타입설계) 중 **타입 설계** 부분. 컨트롤러 분할(F1/F2)은 미테스트 컨트롤러 + 로컬 e2e 부재로 라우트 회귀 검증 불가 → **23-06 으로 분리**(컨트롤러 안전망 선행).

### 문제점 (실측 확인)
- **F3 원시강박(role: string)**: `OrgRole`/`Role` enum 이 `@repo/auth-contracts` 에 있는데 서비스/컴포넌트가 `role: string` 사용 — `org-list.service.ts:13`·`org-members.service.ts:13`(→OrgRole), `admin.service.ts:24`(platform→Role), `org-switch.service.ts:22/31`(membership→OrgRole·user→Role), `apps/web MemberTable.tsx:43`(→OrgRole, `as keyof` 캐스팅도 발생).
- **F4 OAuthUserInfo**: `{ providerAccountId, email, name? }` — google 은 name 보장, kakao 는 없음인데 `name?` 로 뭉뚱그려 어느 provider 가 어떤 필드를 주는지 불명.

### 해결 방안
F3: `role: string` → `OrgRole`/`Role` (문맥별). F4: `OAuthUserInfo` 를 provider 판별 union 으로. **동작 보존** — typecheck 가 SoT.

## 요구사항

1. F3 backend: org-list/org-members(`OrgRole`), admin(`Role`), org-switch(membership `OrgRole`/user `Role`) role 타입화.
2. F3 frontend: `MemberTable` role → `OrgRole`, 불필요 `as keyof` 캐스팅 제거.
3. F4: `OAuthUserInfo` → `{ provider: "google"; ...; name: string } | { provider: "kakao"; ... }` discriminated union + extract 함수/소비자 정합.

## Out of Scope
- **F1/F2 컨트롤러 분할** → 23-06 (auth/account.controller, 컨트롤러 테스트 안전망 선행).
- B2, D2/3/4/6 → 별도/후속.

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 순수 타입 리팩토링 — typecheck 로 검증. 런타임 동작 불변.

## 핵심 전략
| 항목 | 변경 | 검증 |
|:---:|:---|:---|
| F3 | `string` → `OrgRole`/`Role` (auth-contracts) | typecheck + 기존 테스트 |
| F4 | OAuthUserInfo discriminated union | typecheck + oauth.service.test |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/org-list.service.ts` · `org-members.service.ts`
`role: string` → `OrgRole`.

#### [MODIFY] `apps/api/src/admin/admin.service.ts`
`AdminUser.role: string` → `Role` (platform).

#### [MODIFY] `apps/api/src/auth/org-switch.service.ts`
query 결과 `{ role: string }` → membership `OrgRole` / user `Role`.

#### [MODIFY] `apps/web/src/features/orgs/MemberTable.tsx`
role → `OrgRole`, `as keyof` 정리.

#### [MODIFY] `packages/backend/auth-oauth/src/token.ts`
`OAuthUserInfo` discriminated union + `extractGoogleUserInfo`/`extractKakaoUserInfo`/소비자 정합.

## 검증 계획
```bash
pnpm turbo run typecheck --filter=@repo/backend-auth-oauth --filter=@repo/auth-contracts --filter=./apps/api --filter=./apps/web   # 그린
pnpm vitest run apps/api/src/auth/oauth.service.test.ts apps/api/src/auth/org-invite.service.test.ts packages/backend/auth-oauth 2>/dev/null
grep -rn "role: string" apps/api/src apps/web/src | grep -v ".test"   # 의도 외 0
```

## ADR 후보
- [x] 없음 — 기존 enum 활용 + 타입 정밀화.

## ✅ Definition of Done
- [ ] F3/F4 적용 + 영향 패키지 typecheck/기존 테스트 그린
- [ ] 의도 외 `role: string` 0
- [ ] walkthrough/pr_description ship + push
