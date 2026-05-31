import { describe, expect, it } from "vitest";
import { createFactory } from "./index.js";

interface User {
  id: number;
  name: string;
  active: boolean;
}

const userFactory = () =>
  createFactory<User>((seq) => ({ id: seq, name: `user-${seq}`, active: true }));

describe("createFactory", () => {
  it("build 는 시퀀스를 1 부터 증가시킨다", () => {
    const f = userFactory();
    expect(f.build().id).toBe(1);
    expect(f.build().id).toBe(2);
    expect(f.build().name).toBe("user-3");
  });

  it("overrides 를 얕게 병합한다", () => {
    const f = userFactory();
    const u = f.build({ name: "alice", active: false });
    expect(u).toEqual({ id: 1, name: "alice", active: false });
  });

  it("buildList(n) 은 n 개를 연속 시퀀스로 생성한다", () => {
    const f = userFactory();
    const list = f.buildList(3);
    expect(list.map((u) => u.id)).toEqual([1, 2, 3]);
    expect(list).toHaveLength(3);
  });

  it("buildList 의 overrides 는 전체에 적용된다", () => {
    const f = userFactory();
    const list = f.buildList(2, { active: false });
    expect(list.every((u) => u.active === false)).toBe(true);
  });

  it("reset 후 시퀀스는 1 로 돌아간다", () => {
    const f = userFactory();
    f.build();
    f.build();
    f.reset();
    expect(f.build().id).toBe(1);
  });
});
