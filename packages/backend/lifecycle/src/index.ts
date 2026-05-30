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

export function createLifecycle(opts: CreateLifecycleOptions = {}): Lifecycle {
  let ready = opts.ready ?? true;
  const hooks: Array<() => Promise<void>> = [];
  let shuttingDown: Promise<void> | null = null;

  const runHooks = async (): Promise<void> => {
    for (const hook of hooks) {
      try {
        await hook();
      } catch {
        // 정리 훅 실패는 종료를 막지 않는다 (best-effort drain).
      }
    }
  };

  return {
    isReady: () => ready,
    setReady: (value: boolean) => {
      ready = value;
    },
    onShutdown: (hook: () => Promise<void>) => {
      hooks.push(hook);
    },
    shutdown: (options: ShutdownOptions = {}): Promise<void> => {
      if (shuttingDown) return shuttingDown;
      ready = false; // 정리보다 먼저 트래픽 차단
      shuttingDown = (async () => {
        const drain = runHooks();
        const timeoutMs = options.timeoutMs;
        if (!timeoutMs || timeoutMs <= 0) {
          await drain;
          return;
        }
        let timer: NodeJS.Timeout | undefined;
        const timeout = new Promise<void>((resolve) => {
          timer = setTimeout(resolve, timeoutMs);
        });
        await Promise.race([drain, timeout]);
        if (timer) clearTimeout(timer);
      })();
      return shuttingDown;
    },
  };
}
