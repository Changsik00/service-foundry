import { z } from "zod";

/**
 * apps/web-next 의 env 검증.
 *
 * - `API_BASE_URL` — **server-only** (RSC / Route Handler / Server Action). client bundle 미노출
 * - `NEXT_PUBLIC_API_BASE_URL` — **client-side** (client component 안 노출). dev 시 server URL 과 동일, prod 에선 public URL 박음
 *
 * **lazy 호출 패턴**: `getEnv()` 호출 시점에 parse. module load 시점 fail 회피 (Next build 시 env 미박힘 가능).
 */
const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}
