# Walkthrough: spec-26-08

> phase-26 회고(`/hk-phase-review` 4-렌즈 패널) 반영 — 문서 정합 + cursor 누출 차단 + 안전망 강화.

## 📌 결정 기록

| 이슈 | 결정 | 이유 |
|---|---|---|
| ADR-0028 §3 (v7 PK) | **완화: 후속·미배선 명시** | 미시행을 accepted 로 선언한 거짓 정합 제거(회고 C1) |
| 성공기준 #1/#3 | **부분달성 정직화** | uuidv7 유틸만/sub 정규화 후속 — 6항 일괄 PASS 오인 방지(C2) |
| cursor 누출 | **public_id 페이로드 + decode 해석** | admin/org-members cursor base64 디코드 시 내부 uuid 복원되던 §1 위반(S-W1) 차단. 새 secret 불필요 |
| OAuth 콜백 | **controller passthrough + 타입 보장** | 서비스 성공경로 e2e 는 외부 OAuth HTTP mock 비용 큼 → controller 단위로 public_id 계약 가드, 전면 e2e 는 Icebox |

## 💬 사용자 협의

- 회고 후 ship 범위 = "문서 + admin cursor + 안전망 강화"(옵션 C) 선택.

## 🧪 검증 결과

- cursor: admin orgs/users·org-members nextCursor base64 디코드 → 내부 uuid 0 (leak-audit), 페이지네이션 왕복 정상(단위).
- leak-audit 강화: cursor 디코드 스캔 + 배열 length 가드(빈배열 가짜 GREEN 차단).
- oauth: controller 콜백 응답 `userId`=`usr_` passthrough 단언.
- 전체 게이트(fresh 5434): **154/154 tasks**, 회귀 0.

## 🔧 변경

- 문서: ADR-0028 §3 완화·Consequences(3-step→1-step, sub 다형성 정정), phase.md 성공기준·결정표 정직화, `uuidv7.ts` 미배선 주석.
- cursor: `admin.service`(listOrgs/listUsers)·`org-members.service` — cursor=public_id, decode 시 `resolveOrgInternalId`/`resolveUserInternalId` 로 내부 해석 후 `gt`. 단위 mock 통합 체인(resolve+main).
- 안전망: leak-audit cursor base64 스캔 + length 가드; oauth.controller.test public_id passthrough.
- Icebox 승격: sub 정규화·uuidv7 PK·RLS flip·web 부채·api_keys local.ts·firebase-token·provider role→admin.

## 🚧 한계 (명시)

- leak-audit 는 **native 모드** 응답만 순회(provider 전면 패스는 supabase 토큰 mock 필요 → Icebox). provider-me/-org 는 26-03/05 단위·CI provider e2e 가 보조.
- OAuth 서비스 성공경로 전면 e2e(외부 HTTP mock)는 Icebox — 현재 controller passthrough + `OAuthUserRow.publicId` 타입으로 계약 보장.
