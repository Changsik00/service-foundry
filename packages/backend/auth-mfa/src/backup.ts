import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";

const BACKUP_CODE_COUNT = 10;
const BCRYPT_ROUNDS = 10;

export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => randomBytes(4).toString("hex"));
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hash(code, BCRYPT_ROUNDS)));
}

export async function verifyBackupCode(plain: string, hashes: string[]): Promise<number> {
  for (let i = 0; i < hashes.length; i++) {
    if (await compare(plain, hashes[i]!)) return i;
  }
  return -1;
}
