/**
 * @repo/errors — AppError 계층 + JSON 직렬화 (FE/BE 공유).
 *
 * - zod 외 런타임 의존성 0.
 * - Node-only API 금지 (환경 무관).
 * - 라이브러리 specific 가드(axios/fetch 등)는 본 패키지 외 (Phase 4 SDK 영역).
 *
 * 자세한 디자인 결정: docs/adr/0009-app-error-design.md
 */

/**
 * 표준 에러 카탈로그 — HTTP 4xx/5xx 매핑.
 * 사용자 도메인 코드는 `new AppError({ code: "ORDER_FROZEN", ... })`로 자유 확장.
 */
export const STANDARD_ERROR_REGISTRY = {
  VALIDATION: { statusCode: 400, title: "Validation Failed" },
  UNAUTHENTICATED: { statusCode: 401, title: "Authentication Required" },
  FORBIDDEN: { statusCode: 403, title: "Forbidden" },
  NOT_FOUND: { statusCode: 404, title: "Not Found" },
  CONFLICT: { statusCode: 409, title: "Conflict" },
  RATE_LIMIT: { statusCode: 429, title: "Too Many Requests" },
  INTERNAL: { statusCode: 500, title: "Internal Error" },
  BAD_GATEWAY: { statusCode: 502, title: "Bad Gateway" },
} as const;

export type StandardErrorCode = keyof typeof STANDARD_ERROR_REGISTRY;

export interface AppErrorInput {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  cause?: unknown;
}

/**
 * Cross-spec / cross-tier (FE/BE 공유) 에러 표현.
 *
 * - `code`: 도메인 코드 (SCREAMING_SNAKE 또는 `DOMAIN.REASON`).
 * - `statusCode`: HTTP 매핑.
 * - `details`: 도메인 컨텍스트 (선택). 다중 에러는 `{ errors: [{ path, message }] }` 컨벤션.
 * - `cause`: ES2022 chained error. `toJSON`에서 제외 (BE→FE 노출 안전성).
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public override readonly cause?: unknown;

  constructor(input: AppErrorInput) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.statusCode = input.statusCode;
    if (input.details !== undefined) {
      this.details = input.details;
    }
    if (input.cause !== undefined) {
      this.cause = input.cause;
    }
    if (
      typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === "function"
    ) {
      (
        Error as unknown as { captureStackTrace: (target: object, ctor: unknown) => void }
      ).captureStackTrace(this, AppError);
    }
  }
}
