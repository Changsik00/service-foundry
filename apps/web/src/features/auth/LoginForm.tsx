"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { type LoginInput, loginSchema } from "./schema";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await signIn(data);
    if (result.success) {
      // AuthGuard 가 보낸 ?redirect= 복귀 — 내부 경로만 (오픈 리다이렉트 방지)
      const redirect = searchParams.get("redirect");
      router.push(redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/");
      return;
    }
    // enumeration-safe — 어느 쪽이 틀렸는지 노출 금지 (DESIGN §6.1)
    form.setError("password", { message: "이메일 또는 비밀번호가 올바르지 않습니다" });
    form.setFocus("password");
  });

  return (
    <Form {...form}>
      {/* noValidate — 검증은 Zod 단일 (네이티브 email 검증이 submit 을 막아 인라인 에러를 가림) */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
                <PasswordInput autoComplete="current-password" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "로그인 중…" : "로그인"}
        </Button>
      </form>
    </Form>
  );
}
