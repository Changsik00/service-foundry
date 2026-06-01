# @repo/backend-storage

> `Storage` 포트 인터페이스와 테스트·개발용 인메모리 어댑터를 제공하는 framework-agnostic 오브젝트 스토리지 추상화 패키지.

## 설치 / import
```ts
import { createMemoryStorage } from "@repo/backend-storage";
```

## 핵심 API
- `createMemoryStorage({ baseUrl })` — 인메모리 Storage 어댑터 팩토리 (테스트·로컬 개발용)
- `Storage` — `put / get / del / exists / url` 포트 인터페이스 (S3·R2 어댑터 교체 지점)
- `storage.put(key, data, { contentType })` — 객체 저장
- `storage.url(key)` — 객체 URL 반환

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-storage.md`](../../../docs/reference/packages/backend-storage.md)
