/**
 * @repo/frontend-sdk — typed API client for cross-env frontend (Next Server/Client, Vite SPA, Edge).
 *
 * - `createSdk(options)` factory — `ky` 기반, retry/timeout/hooks 옵션 노출
 * - `Sdk` interface — backend-http-client 와 동일 API surface (request/get/post/put/delete/patch)
 * - `AppError` 변환 (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION) — `@repo/errors` 답습
 * - explicit zod schema binding (`schema?: ZodType<T>`) — 호출자가 `@repo/contracts` 의 schema 명시
 *
 * 본 패키지는 ADR-0015 (framework-adapter naming) + ADR-0009 (AppError) 답습.
 * `reqId propagation` 은 frontend 환경 한계 (AsyncLocalStorage 없음) — 호출자가 `headers` 명시.
 */

export {};
