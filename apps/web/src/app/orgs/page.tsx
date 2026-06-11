import { CardCanvas } from "@/components/card-canvas";
import { AuthGuard } from "@/features/auth";
import { OrgSelectList } from "@/features/orgs";

// 조직 선택 (DESIGN §6.3) — 콘솔 셸 밖, 카드 골격. 로그인 필수 (GuestOnly 아닌 AuthGuard)
export default function OrgsPage() {
  return (
    <AuthGuard>
      <CardCanvas>
        <h1 className="mb-6 text-[28px] font-semibold leading-[1.3] tracking-[-0.6px]">
          조직 선택
        </h1>
        <OrgSelectList />
      </CardCanvas>
    </AuthGuard>
  );
}
