import { Card, CardContent, CardHeader, CardTitle } from "@repo/frontend-ui";

import { InviteForm, MemberTable } from "@/features/orgs";

export default function MembersPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-[-0.4px]">멤버</h1>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">멤버 초대</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">멤버 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberTable />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
