# spec-26-08: phase-26 회고 하드닝 (문서 정합 + cursor 누출 + 안전망)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-08` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-08-retro-hardening` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Fix (회고 반영 / 문서·보안·테스트) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

`/hk-phase-review` 4-렌즈 패널이 ship 전 처리할 항목을 도출했다(기능/보안/격리 Critical 0, 문서 정합 1건 차단 + 실재 🟡). 사용자 결정: **문서 정합 + admin cursor 누출 수정 + 누출 안전망 강화**.

### 문제점 (회고 발견)

- **C1 문서 무결성**: ADR-0028 §3 가 "내부 PK uuid v7 default 전환"을 *Decision(accepted)* 으로 선언했으나 실제 PK 는 전부 `gen_random_uuid`(v4), `uuidv7()` 유틸은 dead code. §1(JWT)은 완화 기록됐는데 §3 는 철회/완화 없이 phase.md 결정표에도 잔존.
- **C2 성공기준 정직성**: 성공기준 #3 "listForUserId 수렴/모드 분기 제거"가 미달(sub 정규화 후속 이월)인데 phase.md 문구는 "수렴 완료".
- **S-W1 cursor 누출**: admin(orgs/users)·org-members 의 `nextCursor` 가 `base64(JSON{내부 uuid})` — atob 디코드로 내부 PK 복원 가능(§1 불변식 실위반). leak-audit 가 cursor 를 "불투명"으로 제외해 은폐.
- **안전망 공백**: leak-audit 가 ① provider 모드 미순회 ② base64 cursor 미탐 ③ 빈 배열 시 prefix sanity 가짜 GREEN. OAuth native callback **성공 경로** 무테스트(userId→public_id 계약 회귀 가드 없음).

### 해결 방안

문서 SSOT 교정(코드 무변경) + cursor 페이로드를 **public_id 기반**으로 전환(decode 시 내부 해석, 새 secret 불필요) + leak-audit 강화(cursor base64 디코드 스캔 + provider 패스 + 배열 길이 가드) + OAuth 콜백 성공 e2e.

## 요구사항

1. **ADR-0028 §3 완화**: v7 PK 전환을 "후속(미배선) — 현 PK 는 gen_random_uuid(v4) 유지, `uuidv7()` 는 향후 배선 대기 유틸"로 정정. Decision 표/§3 + phase.md 결정표(L118) 정합. `uuidv7.ts` 에 "미배선" 주석.
2. **phase.md 성공기준 정직화**: #1(uuidv7 default = 유틸만 확립, 미배선)·#3(노출 전환 완료, sub 정규화·모드분기 제거는 후속 이월) 문구를 실제 범위로. 검증결과/Done 에 부분달성 명기.
3. **cursor 내부 uuid 제거**: admin orgs/users·org-members 의 cursor = 마지막 항목의 **public_id**. decode 시 public→내부 해석 후 `gt(id, 내부)` 비교(미해소면 graceful 무필터). 응답 cursor 에 내부 uuid 부재.
4. **leak-audit 강화**: ① nextCursor 를 base64 디코드 후에도 내부 uuid 0 단언 ② provider-me 등 provider 표면 1패스(가능 범위) ③ 배열 positive 단언 전 `length >= 1` 가드.
5. **OAuth 콜백 성공 e2e**: native callback 성공 응답의 `userId` = public_id(`usr_`) 단언.
6. **이월 Icebox 승격**: sub 정규화·web uuid-가정 부채·RLS NULL-permissive flip·uuidv7 PK 배선·api_keys `local.ts` 등재 → queue.md Icebox.

## Out of Scope

- 실제 v7 PK 배선 (plpgsql gen_uuidv7) — Icebox 승격만
- sub 정규화/listForProviderUid 통합 — Icebox
- firebase-token 내부 uuid·parity 알파벳 SoT·api_keys local.ts 등록 — 🟡, 후속/Icebox
- provider 모드 e2e 전면(supabase 토큰 필요) — leak-audit 는 가능 범위만

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] cursor = public_id 기반(decode 시 1 lookup). 정렬키는 createdAt+내부 id 유지(랜덤 public_id 정렬 부적합).
> - [ ] ADR §3 는 **완화(후속 이월)** — v7 PK 를 지금 배선하지 않음(별도 appetite 필요).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| ADR/phase.md | 미배선 명시·부분달성 정직화 | 정본 무결성(거짓 accepted 제거) |
| cursor | public_id 페이로드 + decode 해석 | 내부 uuid 제거, 새 secret 불필요 |
| leak-audit | base64 디코드 스캔 + length 가드 + provider 패스 | 사각 제거(가짜 GREEN·인코딩 우회) |
| oauth | 성공 e2e | 계약 회귀 가드 |

## Proposed Changes

- [MODIFY] `docs/adr/0028-public-id-scheme.md`(§3 완화·3-step→1-step 정정), `backlog/phase-26.md`(성공기준·결정표·검증결과), `packages/backend/id/src/uuidv7.ts`(주석)
- [MODIFY] `apps/api/src/admin/admin.service.ts`·`apps/api/src/auth/org-members.service.ts` — cursor public_id + decode 해석
- [MODIFY] `apps/api/src/auth/public-id-leak-audit.e2e.test.ts` — cursor base64 디코드 스캔 + length 가드 (+ provider 가능 범위)
- [NEW/MODIFY] OAuth 콜백 성공 e2e
- [MODIFY] `backlog/queue.md` — Icebox 승격

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
1. admin/org-members nextCursor base64 디코드 → 내부 uuid 0, 페이지네이션 왕복 정상
2. leak-audit 강화 후 GREEN (cursor 포함 내부 uuid 0)
3. OAuth 콜백 성공 → userId `usr_` 형식
4. 전체 회귀 0

## 롤백 계획

- `git revert`. cursor 포맷 변경은 가역(기존 발급 cursor 는 만료성 — 무중단).

## ADR 후보

- [x] ADR-0028 §3 완화(본 spec) — 신규 ADR 불요.

## ✅ Definition of Done

- [ ] ADR §3/phase.md 정합(미배선 명시), uuidv7 주석
- [ ] cursor 내부 uuid 제거 + leak-audit base64 스캔 GREEN
- [ ] OAuth 콜백 성공 e2e, 이월 Icebox 승격
- [ ] 전체 게이트 회귀 0 + walkthrough/pr_description
