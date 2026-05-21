import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { PasswordResetConfirm, PasswordResetRequest } from "@repo/auth-contracts";
import type { z } from "zod";

// biome-ignore lint/style/useImportType: NestJS decorator metadata requires runtime value
import { PasswordResetService } from "./password-reset.service.js";

function zodPipe<T>(schema: z.ZodType<T>) {
  return {
    transform(value: unknown): T {
      return schema.parse(value);
    },
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post("password/reset")
  @HttpCode(200)
  async requestReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { email } = zodPipe(PasswordResetRequest).transform(body);
    await this.passwordResetService.request(email);
    return { status: "ok" };
  }

  @Post("password/reset/confirm")
  @HttpCode(200)
  async confirmReset(@Body() body: unknown): Promise<{ status: "ok" }> {
    const { token, newPassword } = zodPipe(PasswordResetConfirm).transform(body);
    await this.passwordResetService.confirm(token, newPassword);
    return { status: "ok" };
  }
}
