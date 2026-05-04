import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export function isHashedPassword(value) {
  return typeof value === "string" && value.startsWith("scrypt$");
}

export async function hashPassword(password) {
  if (!password) {
    throw new Error("Password is required");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedValue) {
  if (!isHashedPassword(storedValue)) {
    return password === storedValue;
  }

  const parts = storedValue.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const expectedHex = parts[2];
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length));

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
