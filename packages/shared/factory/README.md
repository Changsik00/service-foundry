# @repo/factory

> `createFactory(builder)` 로 결정적(deterministic) 테스트·시드 객체를 생성하는 framework-agnostic 팩토리.

## 설치 / import

```ts
import { createFactory } from "@repo/factory";
```

## 핵심 API

- `createFactory<T>(builder)` — `(seq: number) => T` builder 함수로 `Factory<T>` 생성
- `factory.build(overrides?)` — 단일 객체 생성 (오버라이드 가능)
- `factory.buildList(n, overrides?)` — n개 목록 생성
- `factory.reset()` — 시퀀스 번호 재설정 (테스트 격리)

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

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-factory.md`](../../../docs/reference/packages/shared-factory.md)
