import { z } from "zod";

/**
 * apps/web-next 의 env 검증.
 *
 * server-only — `NEXT_PUBLIC_` 박지 않음. RSC / Route Handler / Server Action 안에서만 접근.
 * client component 에서 사용 필요 시 props 로 prop drilling 하거나 별 spec 으로 client-safe env 박음.
 */
const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
