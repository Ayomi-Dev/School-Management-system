import crypto from 'crypto'

/**
 * Generates a temporary password the user never sees after creation.
 * Format: 3 words + 4-digit number, e.g. "amber-fox-7291"
 * Easy to read aloud/type but hard to guess.
 */
export function generateTempPassword(): string {
  const adjectives = ["amber", "brave", "calm", "deep", "eager", "fair", "gold", "high", "iron", "jade"];
  const nouns      = ["crane", "delta", "eagle", "flame", "grove", "heron", "ivory", "lark",  "maple", "north"];
  const rand       = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const digits     = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
  return `${rand(adjectives)}-${rand(nouns)}-${digits}`;
}


/**
 * Generates a cryptographically random setup token.
 * Returns both the raw token (for the email link) and its SHA-256 hash (for DB storage).
 * The raw token is NEVER stored — only the hash is.
 */
export function generateVerificationToken(): { raw: string; hash: string } {
  const raw  = crypto.randomBytes(32).toString("hex"); // 64-char hex string sent with a verification link
  const hash = crypto.createHash("sha256").update(raw).digest("hex"); //stored in the db
  return { raw, hash };
}
 