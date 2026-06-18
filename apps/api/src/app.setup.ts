import type { INestApplication } from "@nestjs/common";
import { requestIdMiddleware } from "@repo/backend-logger";
import { applySecurity } from "@repo/nestjs-security";
import cookieParser from "cookie-parser";

import { AppErrorFilter } from "./infra/app-error.filter.js";

export interface ConfigureAppOptions {
  /** CORS 허용 origin (settings.CORS_ORIGIN). e2e 등 생략 시 enableCors 기본(허용). */
  readonly corsOrigin?: string;
}

/**
 * 부트스트랩 미들웨어 배선 SoT (spec-15-04 C1 / spec-16-02 보안헤더 흡수).
 *
 * main.ts 의 prod 부트스트랩과 e2e 테스트가 **동일한** 미들웨어 체인을 타도록
 * 단일 함수로 캡슐화한다. 여기서 배선을 제거하면 prod·test 가 함께 깨지므로
 * "배선 회귀"가 테스트로 차단된다 (이전엔 e2e 가 배선을 복제해 회귀를 놓쳤다).
 *
 * 순서 주의: requestIdMiddleware 가 가장 앞단 — 이후 모든 핸들러/로그/아웃바운드가
 * reqId(AsyncLocalStorage) 컨텍스트를 공유한다. helmet/CORS(applySecurity)는 그 뒤.
 */
export function configureApp(app: INestApplication, opts: ConfigureAppOptions = {}): void {
  app.use(requestIdMiddleware());
  app.use(cookieParser());
  applySecurity(app, { cors: { origin: opts.corsOrigin, credentials: true } });
  // 도메인/패키지에서 전파된 AppError 를 HTTP 로 변환 (ADR-0027).
  app.useGlobalFilters(new AppErrorFilter());
}
