import { z } from "zod";

// 클라이언트 번들에 노출되는 NEXT_PUBLIC_* 변수.
// webpack DefinePlugin이 정적으로 치환하므로 반드시 각 키를 명시 참조해야 함.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

// 서버 전용 변수 (RSC / Route Handler / Server Action)
const serverEnvSchema = publicEnvSchema.extend({
  API_BASE_URL: z.string().url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let publicCached: PublicEnv | undefined;
let serverCached: ServerEnv | undefined;

/** 클라이언트 컴포넌트 전용 — webpack이 process.env.NEXT_PUBLIC_* 정적 치환 */
export function getPublicEnv(): PublicEnv {
  if (!publicCached) {
    publicCached = publicEnvSchema.parse({
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
  }
  return publicCached;
}

/** RSC / 서버 코드 전용 */
export function getEnv(): ServerEnv {
  if (!serverCached) {
    serverCached = serverEnvSchema.parse({
      API_BASE_URL: process.env.API_BASE_URL,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
  }
  return serverCached;
}
