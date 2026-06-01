# @repo/utils

> Node/브라우저 공통으로 쓸 수 있는 순수 함수 모음 — `Result` 타입, 객체 조작, `sleep`.

## 설치 / import

```ts
import { ok, err, isOk, fromPromise } from "@repo/utils";
```

## 핵심 API

- `Result<T, E>` — `{ ok: true; value: T } | { ok: false; error: E }` discriminated union
- `ok(value)`, `err(error)` — Result 생성자 헬퍼
- `isOk(result)`, `isErr(result)` — 타입 가드
- `map(result, fn)`, `flatMap(result, fn)` — Result 변환·체이닝
- `fromPromise(fn)` — Promise → Result 변환 (예외 포획)
- `pick(source, keys)`, `omit(source, keys)` — 객체 키 필터링
- `sleep(ms)` — Promise 기반 지연

## 사용 예

```ts
import { isOk, fromPromise } from "@repo/utils";

const result = await fromPromise(() => fetch("/api/data").then(r => r.json()));
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-utils.md`](../../../docs/reference/packages/shared-utils.md)
