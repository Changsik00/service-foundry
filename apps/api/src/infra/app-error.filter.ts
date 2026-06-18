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
    res.status(exception.statusCode).json(exception.toJSON());
  }
}
