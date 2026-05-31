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

const STUB = "spec-13-03: createMemoryStorage not implemented yet";

/** 테스트/dev 용 in-memory Storage 어댑터. */
export function createMemoryStorage(_opts?: MemoryStorageOptions): Storage {
  throw new Error(STUB);
}
