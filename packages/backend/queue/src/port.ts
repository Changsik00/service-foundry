/** 큐 포트 (framework-agnostic, bullmq 비노출). 어댑터 교체 지점. */

export type JobHandler<T = unknown> = (data: T) => Promise<void>;

export interface Producer {
  enqueue<T>(jobName: string, data: T): Promise<void>;
  close(): Promise<void>;
}

export interface Consumer {
  close(): Promise<void>;
}
