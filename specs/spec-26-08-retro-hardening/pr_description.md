fix(spec-26-08): phase-26 retro hardening (docs + cursor leak + safety net)

## 📋 Summary

### 배경 및 목적
`/hk-phase-review` 4-렌즈 패널이 phase-26 ship 전 처리 항목을 도출(기능/보안/격리 Critical 0, 문서 정합 1건 차단 + 실재 🟡). 사용자 결정(옵션 C): **문서 정합 + admin cursor 누출 + 안전망 강화**.

### 주요 변경 사항
- [x] **문서 정합(C1/C2)**: ADR-0028 §3 완화(v7 PK = 후속·미배선 명시; `uuidv7()` dead-code 주석) + Consequences(3-step→1-step) + phase.md 성공기준 #1/#3 부분달성 정직화 + 결정표 v7 행 정정
- [x] **cursor 누출 차단(S-W1)**: admin orgs/users·org-members 의 nextCursor 가 base64(JSON{내부 uuid}) → atob 디코드로 내부 PK 복원되던 §1 위반. cursor 페이로드를 **public_id** 로 전환(decode 시 내부 해석)
- [x] **안전망 강화**: leak-audit 에 nextCursor base64 디코드 스캔 + 배열 length 가드(빈배열 가짜 GREEN 차단); oauth 콜백 public_id passthrough 단언
- [x] **이월 Icebox 승격**: sub 정규화·uuidv7 PK·RLS flip·web 부채·api_keys local.ts·firebase-token·provider role→admin

### 타입
- **Fix (회고 반영)** · spec-26-08 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **문서 무결성**: ADR §3 가 미시행 v7 PK 를 accepted 로 선언했던 모순 해소(완화 기록). phase.md 6항 일괄 PASS 오인 방지.
2. **cursor public_id**: 정렬키는 createdAt+내부 id 유지(랜덤 public_id 정렬 부적합), cursor 운반값만 public_id + decode 1-lookup.
3. **한계 명시**: leak-audit native 전용·OAuth 전면 e2e 는 Icebox(외부 mock 비용) — controller passthrough + 타입으로 계약 보장.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- cursor 디코드 내부 uuid 0 + 페이지네이션 왕복 + oauth public_id passthrough.
- 전체 **154/154 tasks**, 회귀 0.

## 📦 Files Changed
- `docs/adr/0028-public-id-scheme.md`, `backlog/phase-26.md`, `backlog/queue.md`, `packages/backend/id/src/uuidv7.ts`
- `apps/api/src/admin/admin.service.ts`, `apps/api/src/auth/org-members.service.ts` + 단위
- `apps/api/src/auth/{public-id-leak-audit.e2e,oauth.controller}.test.ts`

## ✅ Definition of Done
- [x] ADR §3/phase.md 정합, cursor 내부 uuid 제거, leak-audit base64 스캔, Icebox 승격
- [x] 전체 게이트 회귀 0

## 🔗 관련
- phase-26 회고(4-렌즈), ADR-0028/0029. **머지 시 phase-26 모든 spec 완료 → phase-ship 준비.**
