# PR: spec-17-04 — 개인 워크스페이스 자동 생성 + 유저 프로비저닝 seam

## Summary

- `ProvisionService.provisionUser(userId, email)` 구현 — db.transaction으로 org INSERT → membership INSERT → users.orgId UPDATE 원자 실행
- `SignupService`에 `ProvisionService` 주입 — 세션 생성 직후 provisionUser 호출
- `auth.module.ts`에 ProvisionService provider 등록
- `users.role` 필드 `@deprecated` 주석 추가

## Test plan

- [x] `provision.service.test.ts` — mock DB transaction으로 3쿼리 순서 및 데이터 흐름 검증
- [x] `signup.service.test.ts` — provisionUser 올바른 인자로 호출됨 검증
- [x] typecheck PASS (전체 모노레포)
- [x] lint PASS (biome)

## 참고

- 기반 브랜치: `phase-17`
- 선행 spec: spec-17-03 (users.org_id 컬럼, RLS)
- 후속 spec: spec-17-05 (active_org JWT 클레임 + strict RLS 활성화)
- 기존 유저(DB 기 존재)는 `org_id = NULL` 유지 — 별도 데이터 마이그레이션 scope 외

🤖 Generated with [Claude Code](https://claude.com/claude-code)
