/**
 * @repo/factory — 테스트/시드 데이터 팩토리.
 *
 * framework-agnostic (shared). 시퀀스 기반으로 결정적인 객체를 생성한다.
 * 시드 스크립트·단위 테스트 양쪽에서 동일 패턴으로 사용.
 */

export interface Factory<T> {
  /** 다음 시퀀스로 객체 1 개 생성 (overrides 얕은 병합) */
  build(overrides?: Partial<T>): T;
  /** n 개 생성 */
  buildList(n: number, overrides?: Partial<T>): T[];
  /** 시퀀스 1 로 초기화 */
  reset(): void;
}

/**
 * builder(seq) 로부터 Factory 를 만든다. seq 는 1 부터 build 마다 증가.
 */
export function createFactory<T>(builder: (seq: number) => T): Factory<T> {
  let seq = 0;
  const build = (overrides?: Partial<T>): T => {
    seq += 1;
    return { ...builder(seq), ...overrides };
  };
  return {
    build,
    buildList: (n, overrides) => Array.from({ length: n }, () => build(overrides)),
    reset: () => {
      seq = 0;
    },
  };
}
