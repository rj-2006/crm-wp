
export function normalizeToE164(raw: string): string {
  const trimmed = raw.trim().replace(/[\s().-]/g, '');
  const candidate = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;

  if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
    throw new Error(`"${raw}" is not a valid E.164 phone number`);
  }
  return candidate;
}
