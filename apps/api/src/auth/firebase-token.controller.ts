import {
  Controller,
  Inject,
  Optional,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { FIREBASE_ADMIN_APP } from "@repo/nestjs-auth-firebase";
import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// [브리지 패턴] 이 컨트롤러는 native Bearer 인증 서버에서 Firebase 클라이언트 SDK 세션이
// 추가로 필요할 때 — 예: Firebase Storage / Realtime DB 직접 접근 — 를 위한 브리지 엔드포인트다.
// AUTH_MODE=firebase처럼 Firebase가 이미 주 인증 수단인 환경에서는 이 endpoint 가 불필요하다.
// FIREBASE_SERVICE_ACCOUNT 미설정 시 503 반환.
@Controller("auth")
export class FirebaseTokenController {
  constructor(
    @Optional()
    @Inject(FIREBASE_ADMIN_APP)
    private readonly app: App | null,
  ) {}

  @UseGuards(AuthGuard)
  @Post("firebase/token")
  async issue(@CurrentUser() user: AuthenticatedUser): Promise<{ customToken: string }> {
    if (!this.app) {
      throw new ServiceUnavailableException("Firebase bridge not configured");
    }
    const customToken = await getAuth(this.app).createCustomToken(user.sub, {
      active_org_id: user.orgId,
      org_role: user.role,
    });
    return { customToken };
  }
}
