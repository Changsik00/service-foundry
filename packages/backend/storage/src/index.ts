/**
 * @repo/backend-storage — object storage 포트 + in-memory 어댑터.
 *
 * framework-agnostic core (ADR-0015). 로컬/클라우드 교체를 위한 추상화.
 * S3/R2 실제 어댑터는 후속 — 본 패키지는 포트 + 테스트/dev 용 in-memory 만.
 */

export type StorageData = Uint8Array | string;

export interface PutOptions {
  /** 저장 객체의 content-type (메타데이터) */
  contentType?: string;
}

/** object storage 추상화. 어댑터는 이 포트를 구현한다. */
export interface Storage {
  /** key 에 데이터 저장 (덮어쓰기) */
  put(key: string, data: StorageData, opts?: PutOptions): Promise<void>;
  /** key 의 데이터 조회 — 미존재 시 null */
  get(key: string): Promise<Uint8Array | null>;
  /** key 삭제 (미존재여도 에러 없음) */
  del(key: string): Promise<void>;
  /** key 존재 여부 */
  exists(key: string): Promise<boolean>;
  /** key 의 접근 URL (어댑터별 스킴) */
  url(key: string): string;
}

export interface MemoryStorageOptions {
  /** url() 의 베이스 — 기본 "memory://" */
  baseUrl?: string;
}

interface StoredObject {
  data: Uint8Array;
  contentType?: string | undefined;
}

function toBytes(data: StorageData): Uint8Array {
  return typeof data === "string" ? new TextEncoder().encode(data) : data;
}

/** 테스트/dev 용 in-memory Storage 어댑터. */
export function createMemoryStorage(opts?: MemoryStorageOptions): Storage {
  const baseUrl = (opts?.baseUrl ?? "memory://").replace(/\/$/, "");
  const store = new Map<string, StoredObject>();

  return {
    async put(key, data, putOpts) {
      store.set(key, { data: toBytes(data), contentType: putOpts?.contentType });
    },
    async get(key) {
      return store.get(key)?.data ?? null;
    },
    async del(key) {
      store.delete(key);
    },
    async exists(key) {
      return store.has(key);
    },
    url(key) {
      return `${baseUrl}/${key}`;
    },
  };
}
