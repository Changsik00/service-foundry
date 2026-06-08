# Walkthrough: spec-17-04

## 변경 요약

신규 유저 가입 시 개인 조직(personal org)과 owner 멤버십을 자동으로 생성하는 `ProvisionService`를 구현하고 `SignupService`에 연결했다.

## 주요 결정 사항

### 1. ProvisionService를 apps/api 내부 서비스로 배치

`apps/api/src/provision/provision.service.ts` 에 단독 파일로 배치. 별도 패키지화는 phase-18 OAuth first-login 재사용 시점에 재평가. 인터페이스(`IProvisionService`) + Symbol 토큰(`PROVISION_SERVICE`)으로 호출부를 추상화했다.

### 2. db.transaction() 원자 실행 보장

org INSERT → membership INSERT → users.orgId UPDATE 세 쿼리를 단일 트랜잭션으로 묶었다. org INSERT가 실패하면 user만 남는 불일치 상태가 방지된다. Drizzle `.returning({ id })` 를 사용해 INSERT 결과를 다음 쿼리에 전달.

### 3. org slug를 randomUUID()로 생성

URL에 노출되는 slug 설계는 spec-17-06 이후 확정. 현재는 충돌 없는 UUID를 사용해 재시도 로직을 생략.

### 4. `users.role` @deprecated 처리

`OrgRole(owner|admin|member)`가 도입된 이후 글로벌 `role` 필드는 불필요하다. 런타임 영향 없이 주석만 추가. 실제 제거는 spec-17-05 이후.

### 5. 테스트 실행 방법

pre-existing 이슈: vitest-config 패키지가 소스(`.ts`) 직접 export 방식이라 Node.js ESM이 설정 파일 로드 시 `ERR_UNKNOWN_FILE_EXTENSION` 오류를 발생시킨다.

우회: `NODE_OPTIONS='--import tsx/esm'` 로더를 사용하면 정상 실행된다.

```bash
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/provision/provision.service.test.ts
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/auth/signup.service.test.ts
```

## 파일 변경 내역

| 파일 | 변경 |
|---|---|
| `apps/api/src/provision/provision.service.ts` | NEW — ProvisionService + IProvisionService + PROVISION_SERVICE |
| `apps/api/src/provision/provision.service.test.ts` | NEW — mock DB transaction 단위 테스트 |
| `apps/api/src/auth/signup.service.ts` | MODIFY — IProvisionService 주입, provisionUser() 호출 |
| `apps/api/src/auth/signup.service.test.ts` | MODIFY — makeProvisionService 팩토리 추가, provisionUser 호출 검증 테스트 추가 |
| `apps/api/src/auth/auth.module.ts` | MODIFY — ProvisionService provider + PROVISION_SERVICE alias 등록 |
| `apps/api/src/infra/schema/users.ts` | MODIFY — role 필드 @deprecated 주석 |

## 검증

- 단위 테스트 5개 PASS (provision: 1, signup: 4)
- typecheck PASS (전체 모노레포)
- lint PASS (biome — non-null assertion 경고는 pre-existing 규칙, 코드 의미상 안전)
