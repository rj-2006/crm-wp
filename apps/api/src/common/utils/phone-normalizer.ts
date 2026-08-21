/**
 * Normalizes a phone number to E.164 format (e.g. +919811022341).
 * Rejects numbers that clearly aren't E.164-normalizable rather than guessing a country code.
 */
export function normalizeToE164(raw: string): string {
  const trimmed = raw.trim().replace(/[\s().-]/g, '');
  const candidate = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;

  if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
    throw new Error(`"${raw}" is not a valid E.164 phone number`);
  }
  return candidate;
}
