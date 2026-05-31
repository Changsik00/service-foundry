---
type: reference
aliases: ["@repo/frontend-auth-supabase", "Supabase 인증 SDK"]
tags: [service-foundry, reference, frontend, auth, oauth]
---

# @repo/frontend-auth-supabase — Supabase Auth `CoreAuthSDK` 어댑터

> 💡 **한 줄 요약**: Supabase Auth를 `CoreAuthSDK` 계약으로 감싼 어댑터 — `supabase.rls` 로 RLS 클라이언트도 노출.
> **위치**: `packages/frontend/auth-supabase` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@supabase/supabase-js`의 인증 API를 `CoreAuthSDK` 계약으로 래핑한다. Supabase 에러를 `AppError`로 정규화하며, `supabase.rls` 프로퍼티로 원본 `SupabaseClient`를 노출해 Row Level Security 쿼리에도 접근할 수 있다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createSupabaseAuthSDK(config)` | fn | `SupabaseConfig` → `CoreAuthSDK & { supabase: SupabaseExtensions }` |
| `SupabaseConfig` | interface | `{ url, anonKey }` |
| `SupabaseExtensions` | interface | `{ rls: SupabaseClient }` — RLS 쿼리용 원본 클라이언트 |

## 의존

- 내부: [[shared-auth-contracts]] (`CoreAuthSDK`, `User`, `Session`, `AuthResult`), [[shared-errors]] (`AppError`)
- 외부: `@supabase/supabase-js`

## 사용 예

```ts
import { createSupabaseAuthSDK } from "@repo/frontend-auth-supabase";

const sdk = createSupabaseAuthSDK({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// RLS 쿼리
const { data } = await sdk.supabase.rls.from("profiles").select("*");
```

## 연결된 개념

- [[adr/0006-auth-strategy]] — Consistent Wrapped SDK 전략
- [[adr/0017-auth-provider-sdk-prop-contract]] — SDK prop 계약
- [[adr/0018-auth-provider-package-location]] — 패키지 위치
- [[explainers/frontend/auth-sdk-provider-adapters]] — 어댑터 패턴
- [[frontend-auth-firebase]] — 동등한 Firebase 어댑터
- [[frontend-auth-react]] — Provider에 주입되는 SDK

> 소스: spec-08-02 · `packages/frontend/auth-supabase/src/index.ts`
