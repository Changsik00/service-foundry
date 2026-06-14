import { FeatureFlagTable } from "@/features/admin/FeatureFlagTable";

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">피처플래그</h2>
        <p className="text-sm text-muted-foreground">기능 on/off 관리</p>
      </div>
      <FeatureFlagTable />
    </div>
  );
}
