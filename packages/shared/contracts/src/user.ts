import { Email, Uuid } from "@repo/validation";
import { z } from "zod";

export const UserProfile = z.object({
  id: Uuid,
  email: Email,
  displayName: z.string().min(1).max(100),
  createdAt: z.iso.datetime(),
});

export type UserProfile = z.output<typeof UserProfile>;
