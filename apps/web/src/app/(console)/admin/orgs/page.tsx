import { OrgTable } from "@/features/admin/OrgTable";

export default function AdminOrgsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">전체 조직</h1>
        <p className="text-sm text-muted-foreground">플랫폼에 등록된 모든 조직 목록</p>
      </div>
      <OrgTable />
    </div>
  );
}
