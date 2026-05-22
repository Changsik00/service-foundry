"use client";

import { useAuth } from "@repo/frontend-auth-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const result = await signIn({ email, password });
    setIsPending(false);
    if (result.success) {
      router.push("/");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "로그인 중..." : "로그인"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
