---
type: reference
aliases: ["@repo/utils", "유틸리티"]
tags: [service-foundry, reference, shared, utils]
---

# @repo/utils — 프레임워크 무관 범용 유틸리티

> 💡 **한 줄 요약**: Node/브라우저 공통으로 쓸 수 있는 순수 함수 모음 — `Result` 타입, 객체 조작, `sleep`.
> **위치**: `packages/shared/utils` · **상위**: [[architecture]]

## 책임 (Responsibility)

런타임 의존성이 없는 최소 유틸리티 레이어로, 모노레포 전체에서 가장 하위에 위치한다. Node-only API를 포함하지 않으며 브라우저/엣지 환경에서도 안전하다. `Result` discriminated-union 은 예외 대신 명시적 성공/실패 분기를 강제한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Result<T, E>` | type | `{ ok: true; value: T } \| { ok: false; error: E }` |
| `ok(value)` | fn | `Result` 성공 래퍼 |
| `err(error)` | fn | `Result` 실패 래퍼 |
| `isOk(result)` | fn | `Result` 성공 타입 가드 |
| `isErr(result)` | fn | `Result` 실패 타입 가드 |
| `map(result, fn)` | fn | 성공 시 값 변환 |
| `flatMap(result, fn)` | fn | 체이닝 (Result 반환 fn) |
| `fromPromise(fn)` | fn | `Promise` → `Result` 변환 (예외 포획) |
| `sleep(ms)` | fn | Promise 기반 지연 |
| `pick(source, keys)` | fn | 객체에서 지정 키만 추출 |
| `omit(source, keys)` | fn | 객체에서 지정 키 제거 |

## 의존

- 내부: (없음 — 최하위 레이어)
- 외부: (없음)

## 사용 예

```ts
import { ok, err, isOk, fromPromise } from "@repo/utils";

const result = await fromPromise(() => fetch("/api/data").then(r => r.json()));
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

## 연결된 개념

- [[adr/0008-result-type]] — Result 타입 채택 근거
- [[shared-errors]] — `Result<T, AppError>` 조합 패턴
- [[shared-validation]] — `parse()` 가 `Result` 반환

> 소스: spec-02-01 · `packages/shared/utils/src/index.ts`
