import { authenticator } from "otplib";

export function generateSecret(): string {
  return authenticator.generateSecret(20);
}

export function generateTotpUri(secret: string, email: string, issuer: string): string {
  return authenticator.keyuri(email, issuer, secret);
}

export function verifyTotp(secret: string, token: string): boolean {
  if (!token) return false;
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}
