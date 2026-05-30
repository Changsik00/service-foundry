/**
 * auth 보안 메트릭 (prom-client).
 *
 * framework-agnostic — registry/카운터만 제공. /metrics 엔드포인트 노출은 앱 책임.
 * 라벨 없는 카운터는 registry.metrics() 에 0 으로도 노출된다.
 */

import { Counter, Registry } from "prom-client";

export interface AuthMetrics {
  registry: Registry;
  recordLoginAttempt(): void;
  recordLoginSuccess(): void;
  recordLoginFailure(): void;
  metricsText(): Promise<string>;
}

export function createAuthMetrics(): AuthMetrics {
  const registry = new Registry();

  const attempts = new Counter({
    name: "auth_login_attempts_total",
    help: "로그인 시도 총횟수",
    registers: [registry],
  });
  const success = new Counter({
    name: "auth_login_success_total",
    help: "로그인 성공 총횟수",
    registers: [registry],
  });
  const failure = new Counter({
    name: "auth_login_failure_total",
    help: "로그인 실패(잘못된 자격증명 등) 총횟수",
    registers: [registry],
  });

  return {
    registry,
    recordLoginAttempt: () => attempts.inc(),
    recordLoginSuccess: () => success.inc(),
    recordLoginFailure: () => failure.inc(),
    metricsText: () => registry.metrics(),
  };
}
