import { Email, Uuid } from "@repo/validation";
import { z } from "zod";

export const Role = z.enum(["user", "admin"]);
export type Role = z.output<typeof Role>;

export const User = z.object({
  id: Uuid,
  email: Email,
  role: Role,
  createdAt: z.iso.datetime(),
});
export type User = z.output<typeof User>;

export const Session = z.object({
  userId: Uuid,
  expiresAt: z.iso.datetime(),
});
export type Session = z.output<typeof Session>;

export const JwtPayload = z.object({
  sub: Uuid,
  role: Role,
  iat: z.number().int(),
  exp: z.number().int(),
});
export type JwtPayload = z.output<typeof JwtPayload>;
