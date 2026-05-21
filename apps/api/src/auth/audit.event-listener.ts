import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { AuditService, AuthEventBus } from "@repo/backend-auth-audit";

@Injectable()
export class AuditEventListener implements OnModuleInit {
  constructor(
    private readonly bus: AuthEventBus,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    this.bus.on((event) => {
      void this.auditService.log(event).catch(() => {});
    });
  }
}
