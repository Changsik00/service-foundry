import { z } from "zod";

// 에러 메시지 톤: 사실 + 다음 행동 (+ 예시) — DESIGN.md §9
export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 비밀번호 규칙 — 폼 강도 힌트(사전 고지)와 1:1 대응 (DESIGN §6.2)
export const PASSWORD_RULES = [
  { id: "length", label: "8자 이상", test: (v: string) => v.length >= 8 },
  {
    id: "mix",
    label: "영문과 숫자 포함",
    test: (v: string) => /[A-Za-z]/.test(v) && /\d/.test(v),
  },
] as const;

export const signupSchema = z
  .object({
    displayName: z.string().min(1, "이름을 입력해주세요").max(100),
    email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다")
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "영문과 숫자를 모두 포함해야 합니다"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
