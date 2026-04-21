import { randomBytes } from "node:crypto";

// Crockford base32 alphabet, skipping I/L/O/U for readability.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateInviteCode(): string {
  // 8 bytes → 64 bits of entropy, encoded as two 4-char base32 groups.
  const bytes = randomBytes(8);
  const chars: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length]);
  }
  return `KST-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}

export function isInviteCodeLike(raw: string): boolean {
  return /^KST-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(raw.trim().toUpperCase());
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}
