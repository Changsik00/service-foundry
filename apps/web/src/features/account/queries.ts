import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { httpClient } from "@/lib/http-client";

// GET /auth/me — apps/api ProviderMeController 응답 계약
// 사용자 식별자는 public_id(`usr_…`) — 내부 uuid 미노출 (ADR-0028, spec-26-03).
const MeSchema = z.object({
  user: z.object({
    id: z.string().nullable(),
    email: z.string().nullable().optional(),
    role: z.string(),
    orgId: z.string().nullable(),
    orgRole: z.string().nullable().optional(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
});

export const accountQueries = {
  me: () =>
    queryOptions({
      queryKey: ["auth", "me"],
      queryFn: () => httpClient.get("/auth/me", { schema: MeSchema, requiresAuth: true }),
      staleTime: 60_000,
    }),
};

// 세션/기기 관리는 native 전용 기능이다. 본 웹은 Supabase(provider) 인증 전용(env 필수)이라
// 세션은 Supabase 가 관리 → 우리 API `/auth/sessions`(native 전용)를 호출하지 않는다.
// (native 모드 웹 지원 시 env optional + 모드 분기로 재도입 — spec-x-web-drop-native-session-ui)
