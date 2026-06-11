"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@repo/frontend-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useInviteMember } from "./mutations";

const inviteSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
  role: z.enum(["admin", "member"]),
});
type InviteInput = z.infer<typeof inviteSchema>;

/** 멤버 초대 — 인라인 폼 (모달 불필요). 403 = org 역할 부족 인라인 (FRONT §4.2) */
export function InviteForm() {
  const invite = useInviteMember();
  const [sent, setSent] = useState(false);
  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSent(false);
    try {
      await invite.mutateAsync(data);
      setSent(true);
      form.reset();
    } catch (err) {
      const status =
        (err as { statusCode?: number; status?: number }).statusCode ??
        (err as { status?: number }).status;
      if (status === 403) {
        form.setError("root", { message: "초대 권한이 없습니다 (owner·admin 만 가능)" });
        return;
      }
      form.setError("root", { message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요" });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="min-w-64 flex-1">
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <FormControl>
                {/* 옵션 2개뿐 — Select 컴포넌트 대신 네이티브 (fill-forward 1회성) */}
                <select
                  {...field}
                  className="h-9 rounded-md bg-background px-3 text-sm shadow-ring focus-visible:outline-none"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          초대 보내기
        </Button>
        {form.formState.errors.root && (
          <p role="alert" className="w-full text-xs text-error-text">
            {form.formState.errors.root.message}
          </p>
        )}
        {sent && <p className="w-full text-xs text-success-text">초대 이메일을 보냈습니다</p>}
      </form>
    </Form>
  );
}
