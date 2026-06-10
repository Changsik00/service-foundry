import { Controller, Get, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";

@Controller("auth")
export class ProviderMeController {
  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }
}
