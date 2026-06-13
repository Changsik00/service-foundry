"use client";

import { cn } from "@repo/frontend-ui";
import { useState } from "react";

import { DeleteSection, PasswordForm, ProfileForm, SessionsCard } from "@/features/account";

type Tab = "프로필" | "보안";
const TABS: Tab[] = ["프로필", "보안"];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("프로필");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold tracking-[-0.4px]">계정 설정</h1>
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 pb-2 text-sm transition-colors duration-100",
              tab === t
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "프로필" && (
        <div className="space-y-6">
          <ProfileForm />
        </div>
      )}
      {tab === "보안" && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">비밀번호 변경</h2>
            <PasswordForm />
          </section>
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">활성 세션</h2>
            <SessionsCard />
          </section>
          <DeleteSection />
        </div>
      )}
    </div>
  );
}
