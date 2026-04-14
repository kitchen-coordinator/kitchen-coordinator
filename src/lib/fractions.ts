// src/lib/fractions.ts

export type FractionInput = string | number | null | undefined;

export const COMMON_FRACTION_SUGGESTIONS = [
  '1/8',
  '1/4',
  '1/3',
  '1/2',
  '2/3',
  '3/4',
  '1',
  '1 1/4',
  '1 1/2',
  '1 3/4',
  '2',
  '2 1/2',
  '3',
  '4 1/3',
] as const;

const MIXED_NUMBER_RE = /^(-?\d+)\s+(\d+)\/(\d+)$/;
const FRACTION_RE = /^(-?\d+)\/(\d+)$/;
const DECIMAL_RE = /^-?\d+(?:\.\d+)?$/;

export function parseFractionInput(input: FractionInput): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Invalid number');
    return input;
  }

  if (input == null) throw new Error('Value required');

  const raw = String(input).trim();
  if (!raw) throw new Error('Value required');

  if (DECIMAL_RE.test(raw)) {
    return Number(raw);
  }

  const mixed = raw.match(MIXED_NUMBER_RE);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);

    if (den === 0) throw new Error('Denominator cannot be 0');

    const frac = num / den;
    return whole < 0 ? whole - frac : whole + frac;
  }

  const fraction = raw.match(FRACTION_RE);
  if (fraction) {
    const num = Number(fraction[1]);
    const den = Number(fraction[2]);

    if (den === 0) throw new Error('Denominator cannot be 0');

    return num / den;
  }

  throw new Error('Invalid format (use 1/2 or 1 1/2)');
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
}

/**
 * Converts decimal to a mixed-number fraction string.
 * Example:
 * 0.5 -> "1/2"
 * 1.5 -> "1 1/2"
 * 4.3333 -> "4 1/3"
 *
 * maxDenominator controls how "nice" the fraction should be.
 */
export function decimalToFractionString(value: number, maxDenominator = 6, tolerance = 0.01): string | null {
  if (!Number.isFinite(value)) return null;

  if (Number.isInteger(value)) return String(value);

  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const whole = Math.floor(abs);
  const frac = abs - whole;

  let bestN = 0;
  let bestD = 1;
  let bestError = Infinity;

  for (let d = 1; d <= maxDenominator; d += 1) {
    const n = Math.round(frac * d);
    const error = Math.abs(frac - n / d);

    if (error < bestError) {
      bestError = error;
      bestN = n;
      bestD = d;
    }
  }

  if (bestError > tolerance) {
    return null;
  }

  if (bestN === 0) {
    return String(sign * whole);
  }

  if (bestN === bestD) {
    return String(sign * (whole + 1));
  }

  const g = gcd(bestN, bestD);
  bestN /= g;
  bestD /= g;

  if (whole === 0) {
    return `${sign < 0 ? '-' : ''}${bestN}/${bestD}`;
  }

  return `${sign < 0 ? '-' : ''}${whole} ${bestN}/${bestD}`;
}

/**
 * Use this when rendering quantities in the UI.
 * If fraction conversion looks weird, it falls back to a rounded decimal.
 */
export function formatQuantityForDisplay(value: number): string {
  // decimalToFractionString(value, maxDenominator, tolerance)
  const frac = decimalToFractionString(value, 6, 0.01);

  if (frac) {
    return frac;
  }

  return Number(value.toFixed(2)).toString();
}
