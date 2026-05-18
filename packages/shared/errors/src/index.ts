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

  /**
   * BE → wire 직렬화. `cause`는 의도적으로 제외 (보안 / 노이즈 회피).
   * 역변환은 `fromJSON`.
   */
  public toJSON(): AppErrorResponse {
    const response: AppErrorResponse = {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
    if (this.details !== undefined) {
      response.details = this.details;
    }
    return response;
  }
}

/**
 * `AppError.toJSON()`의 출력 shape — BE→FE wire format.
 */
export interface AppErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * AppError 인스턴스 가드.
 */
export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

/**
 * 특정 code의 AppError 인스턴스 가드 (code별 narrow).
 *
 * ```ts
 * if (isCode(e, "NOT_FOUND")) { ... }  // e: AppError & { code: "NOT_FOUND" }
 * ```
 */
export const isCode = <C extends string>(e: unknown, code: C): e is AppError & { code: C } =>
  isAppError(e) && e.code === code;

/**
 * Cross-realm 안전 `Error` 가드. iframe/worker 등 다른 realm에서 만들어진 Error에도 동작.
 *
 * `instanceof Error`만으로는 cross-realm에서 false negative — `Object.prototype.toString`으로 보강.
 */
export const isError = (e: unknown): e is Error =>
  e instanceof Error || Object.prototype.toString.call(e) === "[object Error]";

/**
 * 어떤 unknown에서든 사람이 읽을 message를 안전하게 추출.
 *
 * 우선순위: AppError.message → Error.message → string → JSON.stringify → String(e).
 * `try { ... } catch (e) { logger.error(errorMessage(e)) }` 패턴에서 자주 사용.
 */
export const errorMessage = (e: unknown): string => {
  if (isAppError(e)) return e.message;
  if (isError(e)) return e.message;
  if (typeof e === "string") return e;
  if (e === null) return "null";
  if (e === undefined) return "undefined";
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

/**
 * ES2022 `Error.cause` 또는 `AppError.cause` 안전 추출. cause가 없으면 `undefined`.
 */
export const errorCause = (e: unknown): unknown => {
  if (isAppError(e)) return e.cause;
  if (isError(e) && "cause" in e) {
    return (e as Error & { cause?: unknown }).cause;
  }
  return undefined;
};

/**
 * JSON shape이 AppErrorResponse 형태인지 duck typing 검사.
 * `fromJSON`의 가드로 사용.
 */
export const isAppErrorResponse = (json: unknown): json is AppErrorResponse => {
  if (json === null || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  return (
    typeof obj["code"] === "string" &&
    typeof obj["message"] === "string" &&
    typeof obj["statusCode"] === "number"
  );
};

/**
 * 표준 코드별 factory — 모두 STANDARD_ERROR_REGISTRY lookup.
 * 사용자 도메인 코드는 `new AppError({ code: "ORDER_FROZEN", ... })`로 직접 생성.
 */

export const validationError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "VALIDATION",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.VALIDATION.statusCode,
    details,
  });

export const unauthenticatedError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "UNAUTHENTICATED",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.UNAUTHENTICATED.statusCode,
    details,
  });

export const forbiddenError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "FORBIDDEN",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.FORBIDDEN.statusCode,
    details,
  });

export const notFoundError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "NOT_FOUND",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.NOT_FOUND.statusCode,
    details,
  });

export const conflictError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "CONFLICT",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.CONFLICT.statusCode,
    details,
  });

export const rateLimitError = (message: string, details?: unknown): AppError =>
  new AppError({
    code: "RATE_LIMIT",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.RATE_LIMIT.statusCode,
    details,
  });

export const internalError = (message: string, cause?: unknown): AppError =>
  new AppError({
    code: "INTERNAL",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.INTERNAL.statusCode,
    cause,
  });

export const badGatewayError = (message: string, cause?: unknown): AppError =>
  new AppError({
    code: "BAD_GATEWAY",
    message,
    statusCode: STANDARD_ERROR_REGISTRY.BAD_GATEWAY.statusCode,
    cause,
  });

/**
 * `unknown` 에러 (try/catch에서 catch한 값)를 AppError로 변환.
 *
 * - 이미 AppError면 그대로 반환 (pass-through).
 * - 표준 Error면 message 보존 + cause로 원본 보관.
 * - string/object는 message 추출 후 wrap.
 *
 * ```ts
 * try { ... } catch (e) { return err(wrap(e, "INTERNAL", "DB query failed")); }
 * ```
 */
export const wrap = (
  e: unknown,
  code: StandardErrorCode = "INTERNAL",
  message?: string,
): AppError => {
  if (isAppError(e)) return e;
  const registry = STANDARD_ERROR_REGISTRY[code];
  return new AppError({
    code,
    message: message ?? errorMessage(e),
    statusCode: registry.statusCode,
    cause: e,
  });
};

/**
 * FE에서 응답 body를 받아 AppError class로 복원.
 * 무효 shape면 `wrap`으로 fallback (원본 보존).
 */
export const fromJSON = (json: unknown): AppError => {
  if (isAppErrorResponse(json)) {
    return new AppError({
      code: json.code,
      message: json.message,
      statusCode: json.statusCode,
      details: json.details,
    });
  }
  return wrap(json, "INTERNAL", "Invalid error response shape");
};
