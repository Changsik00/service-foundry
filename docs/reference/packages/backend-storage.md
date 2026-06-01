---
type: reference
aliases: ["@repo/backend-storage", "오브젝트 스토리지 포트"]
tags: [service-foundry, reference, backend, storage]
---

# @repo/backend-storage — Object Storage 포트 + 인메모리 어댑터

> 💡 **한 줄 요약**: `Storage` 포트 인터페이스와 테스트·개발용 인메모리 어댑터를 제공하는 framework-agnostic 오브젝트 스토리지 추상화 패키지.
> **위치**: `packages/backend/storage` · **상위**: [[architecture]]

## 책임 (Responsibility)

파일/객체 저장소 접근을 `Storage` 포트로 추상화하여 로컬·S3·R2 등 다양한 백엔드로 교체 가능하게 한다. `createMemoryStorage`는 테스트 및 로컬 개발용 인메모리 구현이다. S3/R2 실제 어댑터는 후속 패키지로 제공 예정이다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Storage` | type | put/get/del/exists/url 포트 인터페이스 |
| `StorageData` | type | 저장 데이터 타입 (Uint8Array 또는 string) |
| `PutOptions` | type | 저장 옵션 타입 (contentType) |
| `createMemoryStorage` | fn | 인메모리 Storage 어댑터 팩토리 |
| `MemoryStorageOptions` | type | 인메모리 어댑터 옵션 타입 |

## 의존

- 내부: 없음
- 외부: 없음

## 사용 예

```ts
import { createMemoryStorage } from "@repo/backend-storage";

const storage = createMemoryStorage({ baseUrl: "memory://" });
await storage.put("avatars/u1.png", imageBytes, { contentType: "image/png" });
const data = await storage.get("avatars/u1.png");
const exists = await storage.exists("avatars/u1.png"); // true
const url = storage.url("avatars/u1.png"); // "memory://avatars/u1.png"
await storage.del("avatars/u1.png");
```

## 연결된 개념

- [[backend-idempotency]] — 저장소 포트-어댑터 교체 패턴 공통 설계
- [[backend-notification]] — 파일 첨부 알림과의 조합
- [[backend-outbox]] — 트랜잭션 내 파일 메타데이터 기록 패턴

> 소스: spec-13-03 · `packages/backend/storage/src/`
