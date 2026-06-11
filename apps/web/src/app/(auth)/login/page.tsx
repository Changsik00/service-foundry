import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-[28px] font-semibold leading-[1.3] tracking-[-0.6px]">로그인</h1>
      {/* useSearchParams 사용 client 컴포넌트 — Suspense 경계 필수 (Next) */}
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-primary hover:text-brand-hover">
          회원가입
        </Link>
      </p>
    </>
  );
}
