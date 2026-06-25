# Task List: spec-26-08

> One Task = One Commit. 회고 반영 — 문서 정합 + cursor 누출 + 안전망.

---

## Task 1: 문서 정합 (ADR §3 완화 + phase.md 정직화)
### 1-1. 브랜치
- [x] `git checkout -b spec-26-08-retro-hardening` (base: `phase-26-id-scheme-public-id`)
### 1-2. 문서
- [x] `docs/adr/0028` §3 완화(v7 PK 후속·미배선) + 3-step→1-step 정정. `phase.md` 성공기준 #1/#3 정직화 + 결정표 v7 행 정정. `uuidv7.ts` "미배선" 주석
- [x] Commit: `docs(spec-26-08): reconcile ADR-0028 §3 / phase-26 success criteria with shipped scope`

## Task 2: cursor 내부 uuid 제거 (TDD)
### 2-1. 테스트 (Red)
- [x] e2e: admin orgs/users·org-members 의 `nextCursor` base64 디코드 → 내부 uuid 0 + 페이지네이션 왕복(2페이지) 정상
- [x] Commit: `test(spec-26-08): assert cursors carry no internal uuid + pagination roundtrip`
### 2-2. 구현 (Green)
- [x] `admin.service.ts`·`org-members.service.ts`: cursor = public_id, decode 시 public→내부 해석 후 gt 비교
- [x] 단위/e2e PASS, typecheck
- [x] Commit: `fix(spec-26-08): cursors use public_id (no internal uuid leak)`

## Task 3: leak-audit 강화 + OAuth 콜백 성공 e2e (TDD)
### 3-1. 구현
- [x] `public-id-leak-audit.e2e.test.ts`: nextCursor base64 디코드 스캔 + 배열 length 가드 + (가능 시) provider 패스
- [x] OAuth native callback 성공 e2e → userId `usr_` 단언
- [x] PASS
- [x] Commit: `test(spec-26-08): harden leak-audit (cursor decode, length guard) + oauth callback success`

## Task 4: 이월 Icebox 승격
- [x] `queue.md` Icebox: sub 정규화·web uuid 부채·RLS flip·uuidv7 PK·api_keys local.ts
- [x] Commit: `docs(spec-26-08): promote deferred phase-26 items to Icebox`

## Task 5: Ship
### 🚦 Gate
- [x] `turbo run lint typecheck test` (fresh 5434) → 회귀 0
### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-26-08): ship walkthrough and pr description`
### 🚀 Push & PR
- [x] push + PR (base: `phase-26-id-scheme-public-id`)
