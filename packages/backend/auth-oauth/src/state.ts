import { randomBytes, timingSafeEqual } from "node:crypto";

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyState(stateParam: string, cookieState: string): boolean {
  if (!stateParam || !cookieState) return false;
  if (stateParam.length !== cookieState.length) return false;
  try {
    return timingSafeEqual(Buffer.from(stateParam), Buffer.from(cookieState));
  } catch {
    return false;
  }
}
