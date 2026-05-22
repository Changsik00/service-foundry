export const JWT_SIGN_OPTIONS = Symbol("JWT_SIGN_OPTIONS");

export interface JwtSignOptions {
  issuer: string;
  audience: string;
}
