import Link from "next/link";
import { Suspense } from "react";

import { SignupForm } from "@/features/auth";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-[28px] font-semibold leading-[1.3] tracking-[-0.6px]">회원가입</h1>
      <Suspense>
        <SignupForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary hover:text-brand-hover">
          로그인
        </Link>
      </p>
    </>
  );
}
