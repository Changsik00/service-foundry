# @repo/frontend-auth-supabase

> Supabase Auth를 `CoreAuthSDK` 계약으로 감싼 어댑터 — `supabase.rls`로 RLS 클라이언트도 노출.

## 설치 / import
```ts
import { createSupabaseAuthSDK } from "@repo/frontend-auth-supabase";
```

## 핵심 API
- `createSupabaseAuthSDK(config)` — `SupabaseConfig` → `CoreAuthSDK & { supabase: SupabaseExtensions }` 인스턴스 생성
- `SupabaseConfig` — `{ url, anonKey }` 설정 인터페이스
- `SupabaseExtensions` — `{ rls: SupabaseClient }` — RLS 쿼리용 원본 클라이언트

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-auth-supabase.md`](../../../docs/reference/packages/frontend-auth-supabase.md)
- 동작 원리: [`docs/explainers/frontend/auth-sdk-provider-adapters.md`](../../../docs/explainers/frontend/auth-sdk-provider-adapters.md)
