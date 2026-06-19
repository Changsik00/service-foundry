import type { ArgumentsHost } from "@nestjs/common";
import { AppError } from "@repo/errors";
import { describe, expect, it, vi } from "vitest";
import { AppErrorFilter } from "./app-error.filter.js";

function makeHost(res: unknown): ArgumentsHost {
  return { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
}

describe("AppErrorFilter", () => {
  it("AppError → statusCode + toJSON 본문으로 응답", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const err = new AppError({ code: "NOT_FOUND", message: "없음", statusCode: 404 });

    new AppErrorFilter().catch(err, makeHost({ status }));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(err.toJSON());
  });

  it("details 포함 AppError 도 details 를 전달", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const err = new AppError({
      code: "VALIDATION",
      message: "검증 실패",
      statusCode: 400,
      details: { errors: [{ path: "email", message: "invalid" }] },
    });

    new AppErrorFilter().catch(err, makeHost({ status }));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION", statusCode: 400, details: err.details }),
    );
  });

  it("비정상 statusCode(0) → 500 으로 클램프", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const err = new AppError({ code: "NETWORK", message: "fetch failed", statusCode: 0 });

    new AppErrorFilter().catch(err, makeHost({ status }));

    expect(status).toHaveBeenCalledWith(500);
  });

  it("5xx → 내부 message/details 미노출 (일반화)", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const err = new AppError({
      code: "INTERNAL",
      message: "drizzleSessionStore: insert returned no row",
      statusCode: 500,
      details: { table: "sessions" },
    });

    new AppErrorFilter().catch(err, makeHost({ status }));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL",
      message: "Internal error",
      statusCode: 500,
    });
    // 내부 message·details 가 본문에 없어야 한다.
    const body = (json.mock.calls[0] as [Record<string, unknown>])[0];
    expect(body.message).not.toContain("drizzleSessionStore");
    expect(body.details).toBeUndefined();
  });
});
