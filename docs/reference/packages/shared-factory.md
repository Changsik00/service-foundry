---
type: reference
aliases: ["@repo/factory", "테스트 팩토리"]
tags: [service-foundry, reference, shared, factory]
---

# @repo/factory — 시퀀스 기반 테스트 데이터 팩토리

> 💡 **한 줄 요약**: `createFactory(builder)` 로 결정적(deterministic) 테스트·시드 객체를 생성하는 framework-agnostic 팩토리.
> **위치**: `packages/shared/factory` · **상위**: [[architecture]]

## 책임 (Responsibility)

외부 의존성 없이 시퀀스 번호 기반으로 유일한 객체를 생성한다. 단위 테스트와 DB 시드 스크립트 양쪽에서 동일한 패턴으로 사용할 수 있다. `reset()`으로 시퀀스를 재설정해 테스트 격리를 지원한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Factory<T>` | interface | `build`, `buildList`, `reset` 메서드 계약 |
| `createFactory<T>(builder)` | fn | `(seq: number) => T` builder 로 Factory 생성 |

## 의존

- 내부: (없음)
- 외부: (없음)

## 사용 예

```ts
import { createFactory } from "@repo/factory";

const userFactory = createFactory((seq) => ({
  id: `user-${seq}`,
  email: `user${seq}@example.com`,
  role: "user" as const,
  createdAt: new Date().toISOString(),
}));

const user = userFactory.build({ role: "admin" });
const users = userFactory.buildList(5);
userFactory.reset();
```

## 연결된 개념

- [[shared-auth-contracts]] — `User` 타입 팩토리 생성에 주로 사용
- [[shared-contracts]] — `UserProfile` 등 도메인 객체 생성
- [[shared-errors]] — 에러 케이스 테스트용 팩토리 조합

> 소스: spec-13-03 · `packages/shared/factory/src/index.ts`
