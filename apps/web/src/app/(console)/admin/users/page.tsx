import { UserTable } from "@/features/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">전체 유저</h1>
        <p className="text-sm text-muted-foreground">플랫폼에 가입된 모든 유저 목록</p>
      </div>
      <UserTable />
    </div>
  );
}
