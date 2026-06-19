import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import { AppError } from "@repo/errors";
import type { Response } from "express";

/**
 * 도메인/패키지에서 전파된 `AppError` 를 HTTP 응답으로 변환하는 전역 필터 (ADR-0027).
 * `AppError.statusCode` 를 HTTP 상태로, `toJSON()`(code/message/statusCode/details) 을 본문으로.
 * 경계(controller/guard)에서 발생한 에러는 NestJS 예외를 그대로 쓴다(본 필터 비대상).
 */
@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: AppError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    // 비정상 statusCode(예: http-client NETWORK 의 0)는 500 으로 클램프.
    const status =
      exception.statusCode >= 400 && exception.statusCode <= 599 ? exception.statusCode : 500;
    const body = exception.toJSON();
    // 5xx 는 내부 message/details 를 클라이언트에 노출하지 않는다 (정보 노출 방지, ADR-0027).
    if (status >= 500) {
      res.status(status).json({ code: body.code, message: "Internal error", statusCode: status });
      return;
    }
    res.status(status).json({ ...body, statusCode: status });
  }
}
