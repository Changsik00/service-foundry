import { CardCanvas } from "@/components/card-canvas";
import { InviteAccept } from "@/features/orgs";

// 초대 수락 (DESIGN §6.4) — 공개 라우트, 내부에서 로그인 분기
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <CardCanvas>
      <h1 className="mb-6 text-[28px] font-semibold leading-[1.3] tracking-[-0.6px]">초대 수락</h1>
      <InviteAccept token={token} />
    </CardCanvas>
  );
}
