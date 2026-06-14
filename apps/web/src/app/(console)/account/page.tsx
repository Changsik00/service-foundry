"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/frontend-ui";

import { DeleteSection, PasswordForm, ProfileForm, SessionsCard } from "@/features/account";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold tracking-[-0.4px]">계정 설정</h1>
      <Tabs defaultValue="프로필">
        <TabsList className="mb-6">
          <TabsTrigger value="프로필">프로필</TabsTrigger>
          <TabsTrigger value="보안">보안</TabsTrigger>
        </TabsList>
        <TabsContent value="프로필">
          <div className="space-y-6">
            <ProfileForm />
          </div>
        </TabsContent>
        <TabsContent value="보안">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
