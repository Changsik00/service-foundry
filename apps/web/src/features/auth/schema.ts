import { z } from "zod";

// 에러 메시지 톤: 사실 + 다음 행동 (+ 예시) — DESIGN.md §9
export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const signupSchema = z.object({
  displayName: z.string().min(1, "이름을 입력해주세요").max(100),
  email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
  // 규칙은 헬퍼 텍스트로 사전 고지 — 입력 후 깜짝 에러 금지 (DESIGN §6.2)
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
