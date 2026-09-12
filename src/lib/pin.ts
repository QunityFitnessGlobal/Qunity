import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// SERVER-ONLY. Salted+hashed 4-digit parent PIN storage (parents.pin_hash),
// using Node's built-in scrypt instead of adding a bcrypt-style dependency —
// this is a low-entropy local "unlock the same device" gate, not a password,
// so stdlib scrypt is plenty; see the schema.sql comment on pin_hash for what
// this PIN can and can't do.
const KEY_LENGTH = 32;

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
