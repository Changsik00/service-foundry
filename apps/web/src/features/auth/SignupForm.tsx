"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AppError } from "@repo/errors";
import { useAuth } from "@repo/frontend-auth-react";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@repo/frontend-ui";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { type SignupInput, signupSchema } from "./schema";

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", email: "", password: "" },
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
                <Input type="password" autoComplete="new-password" className="h-11" {...field} />
              </FormControl>
              {/* 규칙 사전 고지 — 입력 후 깜짝 에러 금지 (DESIGN §6.2). 에러 시 FormMessage 가 대체 */}
              {!form.formState.errors.password && (
                <FormDescription>비밀번호는 8자 이상이어야 합니다</FormDescription>
              )}
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
