import { Global, Module } from "@nestjs/common";

import { TENANT_ALS, TenantAls } from "./tenant.js";

/**
 * 요청 스코프 테넌트 컨텍스트(ALS)의 **공유 단일 인스턴스**.
 *
 * DATABASE proxy(wrapDb)·TenantContextInterceptor·org 서비스(invite accept 의 시스템 컨텍스트)가
 * 모두 *같은* 인스턴스를 써야 컨텍스트가 일관되므로 모듈 레벨 싱글톤으로 둔다.
 */
export const tenantAls = new TenantAls();

@Global()
@Module({
  providers: [{ provide: TENANT_ALS, useValue: tenantAls }],
  exports: [TENANT_ALS],
})
export class TenantModule {}
