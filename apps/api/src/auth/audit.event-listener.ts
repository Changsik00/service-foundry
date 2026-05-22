import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { AuditService, AuthEventBus } from "@repo/backend-auth-audit";

@Injectable()
export class AuditEventListener implements OnModuleInit {
  constructor(
    @Inject(AuthEventBus) private readonly bus: AuthEventBus,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    this.bus.on((event) => {
      void this.auditService.log(event).catch(() => {});
    });
  }
}
