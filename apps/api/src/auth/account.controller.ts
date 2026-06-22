import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { AccountService } from "./account.service.js";
import { CsrfGuard } from "./csrf.guard.js";

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const S_StatusOk = {
  type: "object",
  properties: { status: { type: "string", enum: ["ok"], example: "ok" } },
  required: ["status"],
};

@ApiTags("account")
@Controller("auth/account")
export class AccountController {
  constructor(@Inject(AccountService) private readonly accountService: AccountService) {}

  @ApiOperation({
    summary: "비밀번호 변경",
    description: "현재 비밀번호를 검증한 뒤 새 비밀번호로 교체합니다. 세션은 유지됩니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        currentPassword: { type: "string", example: "OldPass@123", description: "현재 비밀번호" },
        newPassword: {
          type: "string",
          minLength: 8,
          maxLength: 128,
          example: "NewPass@456",
          description: "새 비밀번호 (최소 8자, 최대 128자)",
        },
      },
      required: ["currentPassword", "newPassword"],
    },
  })
  @ApiResponse({ status: 200, description: "변경 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "현재 비밀번호 불일치 또는 미인증" })
  @Patch("password")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async changePassword(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };
    await this.accountService.changePassword(user.sub, currentPassword, newPassword);
    return { status: "ok" };
  }

  @ApiOperation({
    summary: "프로필 변경",
    description: "표시 이름(displayName)을 업데이트합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        displayName: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          example: "홍길동",
          description: "새 표시 이름",
        },
      },
      required: ["displayName"],
    },
  })
  @ApiResponse({ status: 200, description: "변경 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
  @Patch("profile")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async updateProfile(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok" }> {
    const { displayName } = body as { displayName: string };
    await this.accountService.updateProfile(user.sub, displayName);
    return { status: "ok" };
  }

  @ApiOperation({
    summary: "계정 탈퇴",
    description:
      "계정을 soft-delete 처리합니다. 모든 활성 세션이 즉시 revoke됩니다. " +
      "조직의 단독 owner인 경우 다른 멤버에게 소유권을 이전한 뒤 탈퇴해야 합니다.",
  })
  @ApiBearerAuth("access-token")
  @ApiHeader({ name: "X-Csrf-Token", required: true, description: "GET /auth/csrf 로 발급한 토큰" })
  @ApiResponse({ status: 200, description: "탈퇴 성공", schema: S_StatusOk })
  @ApiResponse({ status: 401, description: "미인증" })
  @ApiResponse({
    status: 409,
    description: "조직 단독 owner — 소유권 이전 후 재시도",
    schema: {
      type: "object",
      properties: { message: { type: "string", example: "단독 owner는 탈퇴할 수 없습니다" } },
    },
  })
  @Delete()
  @UseGuards(AuthGuard, CsrfGuard)
  @HttpCode(200)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<{ status: "ok" }> {
    await this.accountService.deleteAccount(user.sub);
    return { status: "ok" };
  }

  @ApiOperation({
    summary: "아바타 업로드",
    description: "프로필 이미지를 업로드합니다. JPEG·PNG·WebP, 최대 2 MB.",
  })
  @ApiBearerAuth("access-token")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
          description: "이미지 파일 (JPEG/PNG/WebP, max 2 MB)",
        },
      },
      required: ["avatar"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "업로드 성공",
    schema: {
      type: "object",
      properties: { status: { type: "string", enum: ["ok"] }, avatarUrl: { type: "string" } },
      required: ["status", "avatarUrl"],
    },
  })
  @ApiResponse({ status: 400, description: "파일 크기 초과 또는 허용되지 않는 형식" })
  @ApiResponse({ status: 401, description: "미인증" })
  @Post("avatar")
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 2 * 1024 * 1024 + 1 } }))
  @HttpCode(200)
  async uploadAvatar(
    @UploadedFile() file: MulterFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: "ok"; avatarUrl: string }> {
    if (!file) throw new BadRequestException("파일이 없습니다");
    const avatarUrl = await this.accountService.updateAvatar(user.sub, file.buffer, file.mimetype);
    return { status: "ok", avatarUrl };
  }
}
