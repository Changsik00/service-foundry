/**
 * @repo/backend-lifecycle — readiness 플래그 + graceful shutdown 드레인 (core).
 *
 * readiness≠liveness: 종료 시작 시 readiness=false 로 먼저 전환(LB 트래픽 차단),
 * 그 다음 등록된 정리 훅을 실행(타임아웃 보호). shutdown 은 idempotent.
 */

export interface ShutdownOptions {
  timeoutMs?: number;
}

export interface Lifecycle {
  isReady(): boolean;
  setReady(ready: boolean): void;
  onShutdown(hook: () => Promise<void>): void;
  shutdown(opts?: ShutdownOptions): Promise<void>;
}

export interface CreateLifecycleOptions {
  ready?: boolean;
}

// TDD 스텁 — 구현은 Green 단계.
export function createLifecycle(_opts?: CreateLifecycleOptions): Lifecycle {
  throw new Error("not implemented");
}
