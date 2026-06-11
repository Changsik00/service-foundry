"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AppError } from "@repo/errors";
import { useAuth } from "@repo/frontend-auth-react";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
} from "@repo/frontend-ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PASSWORD_RULES, type SignupInput, signupSchema } from "./schema";

/** 규칙 충족 라이브 표시 — 색 + 기호 병행 (색 단독 의미 전달 금지, DESIGN §4.5) */
function PasswordRuleHints({ value }: { value: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={ok ? "text-xs text-success-text" : "text-xs text-muted-foreground"}
          >
            {ok ? "✓" : "·"} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", email: "", password: "", passwordConfirm: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      if (result.success) {
        // 개인 워크스페이스는 첫 인증 API 호출 시 자동 프로비저닝 (ADR-0022) — 콘솔 직행
        router.push("/");
        return;
      }
      if (result.reason === "unverified_email") {
        // 이메일 확인(Confirm email) 활성 프로젝트 — 계정 생성됨, 세션은 메일 확인 후.
        // dev 는 OFF(e2e 결정론), prod 는 ON 복원 필수 — env.sample Supabase 섹션 참조.
        setAwaitingConfirm(true);
        return;
      }
      if (result.reason === "rate_limited") {
        form.setError("root", { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" });
        return;
      }
      form.setError("root", { message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요" });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 409) {
        form.setError("email", { message: "이미 사용 중인 이메일입니다" });
        form.setFocus("email");
        return;
      }
      form.setError("root", { message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요" });
    }
  });

  if (awaitingConfirm) {
    // 사실 + 다음 행동 (DESIGN §9) — 축하 문구·일러스트 없음
    return (
      <p className="text-sm leading-relaxed text-secondary-foreground">
        확인 이메일을 보냈습니다. 메일함에서 가입을 완료해주세요
      </p>
    );
  }

  return (
    <Form {...form}>
      {/* noValidate — 검증은 Zod 단일 (네이티브 email 검증이 submit 을 막아 인라인 에러를 가림) */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input autoComplete="name" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="user@example.com"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" className="h-11" {...field} />
              </FormControl>
              {/* 규칙 사전 고지 + 입력에 따라 충족 표시 — 깜짝 에러 금지 (DESIGN §6.2) */}
              <PasswordRuleHints value={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p role="alert" className="text-xs text-error-text">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "계정 만드는 중…" : "계정 만들기"}
        </Button>
      </form>
    </Form>
  );
}
