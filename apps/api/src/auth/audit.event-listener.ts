import { Injectable, type OnModuleInit } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { AuditService, AuthEventBus } from "@repo/backend-auth-audit";

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
