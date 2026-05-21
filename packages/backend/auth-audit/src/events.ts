export type AuthEvent =
  | { type: "SIGNED_IN"; userId: string; sessionId: string; ip?: string; userAgent?: string }
  | { type: "SIGNED_OUT"; sessionId: string }
  | { type: "TOKEN_REFRESHED"; sessionId: string }
  | { type: "PASSWORD_CHANGED"; userId: string }
  | { type: "LOGIN_FAILED"; email: string; ip?: string; reason: string }
  | { type: "SESSION_REVOKED"; sessionId: string; reason: string }
  | { type: "MFA_ENROLLED"; userId: string; method: string }
  | { type: "SUSPICIOUS_ACTIVITY"; userId: string; signal: string };
