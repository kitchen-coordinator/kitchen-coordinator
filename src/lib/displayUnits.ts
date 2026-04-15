import { formatQuantityForDisplay } from './fractions';
import { convert, getUnitCategory, normalizeUnit, type Unit, type UnitCategory } from './units';

export type DisplayAmountInput = {
  quantity: number;
  unit: string;
  displayQuantity?: number | null;
  displayUnit?: string | null;
};

export type DisplayAmount = {
  quantity: number;
  unit: string;
};

function trimTrailingZeros(value: number, fractionDigits: number) {
  return Number(value.toFixed(fractionDigits)).toString();
}

function roundForDisplay(value: number): number {
  const abs = Math.abs(value);

  if (abs === 0) return 0;
  if (abs >= 1000) return Math.round(value);
  if (abs >= 100) return Number(value.toFixed(1));
  if (abs >= 1) return Number(value.toFixed(2));
  if (abs >= 0.1) return Number(value.toFixed(3));
  if (abs >= 0.01) return Number(value.toFixed(4));
  return Number(value.toFixed(5));
}

function getPreferredDisplayUnit(quantity: number, unit: Unit): Unit {
  const category = getUnitCategory(unit);

  if (category === 'count') return unit;

  if (category === 'mass') {
    const grams = convert(quantity, unit, 'g');

    if (unit === 'lb' || unit === 'oz') {
      return grams >= convert(1, 'lb', 'g') ? 'lb' : 'oz';
    }

    if (grams >= 1000) return 'kg';
    if (grams < 1) return 'mg';
    return 'g';
  }

  const milliliters = convert(quantity, unit, 'ml');

  if (unit === 'tsp' || unit === 'tbsp' || unit === 'cup') {
    if (milliliters >= convert(1, 'cup', 'ml')) return 'cup';
    if (milliliters >= convert(1, 'tbsp', 'ml')) return 'tbsp';
    return 'tsp';
  }

  if (unit === 'fl_oz') {
    return milliliters >= convert(8, 'fl_oz', 'ml') ? 'cup' : 'fl_oz';
  }

  return milliliters >= 1000 ? 'l' : 'ml';
}

function toDisplayUnitLabel(unit: Unit): string {
  return unit === 'fl_oz' ? 'fl oz' : unit;
}

function isFractionFriendlyUnit(unit: string) {
  const raw = unit.trim().toLowerCase();
  if (!raw) return false;

  try {
    const normalized = normalizeUnit(raw);
    return normalized === 'cup' || normalized === 'tbsp' || normalized === 'tsp' || normalized === 'pcs';
  } catch {
    return true;
  }
}

export function normalizeAmountForDisplay(quantity: number, unit: string): DisplayAmount {
  if (!Number.isFinite(quantity)) {
    return { quantity: 0, unit };
  }

  try {
    const normalizedUnit = normalizeUnit(unit);
    const preferredUnit = getPreferredDisplayUnit(quantity, normalizedUnit);
    const convertedQuantity = convert(quantity, normalizedUnit, preferredUnit);

    return {
      quantity: roundForDisplay(convertedQuantity),
      unit: toDisplayUnitLabel(preferredUnit),
    };
  } catch {
    return {
      quantity: roundForDisplay(quantity),
      unit,
    };
  }
}

export function getPantryDisplayAmount(produce: DisplayAmountInput): DisplayAmount {
  if (produce.displayQuantity != null) {
    return {
      quantity: roundForDisplay(produce.displayQuantity),
      unit:
        produce.displayUnit && produce.displayUnit.trim() !== ''
          ? produce.displayUnit
          : produce.unit,
    };
  }

  return normalizeAmountForDisplay(produce.quantity, produce.unit);
}

export function formatDisplayQuantity(quantity: number, unit?: string | null): string {
  const safeUnit = unit?.trim() ?? '';
  const rounded = roundForDisplay(quantity);

  if (safeUnit && isFractionFriendlyUnit(safeUnit)) {
    return formatQuantityForDisplay(rounded);
  }

  const abs = Math.abs(rounded);
  if (abs === 0) return '0';
  if (abs < 0.01) return trimTrailingZeros(rounded, 5);
  if (abs < 0.1) return trimTrailingZeros(rounded, 4);
  if (abs < 1) return trimTrailingZeros(rounded, 3);
  if (abs < 100) return trimTrailingZeros(rounded, 2);
  return trimTrailingZeros(rounded, 1);
}

export function formatDisplayAmount(amount: DisplayAmount): string {
  const quantityLabel = formatDisplayQuantity(amount.quantity, amount.unit);
  return amount.unit ? `${quantityLabel} ${amount.unit}` : quantityLabel;
}

export function tryConvertAmount(quantity: number, fromUnit?: string | null, toUnit?: string | null): number | null {
  if (!Number.isFinite(quantity) || !fromUnit || !toUnit) return null;

  try {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);
    return convert(quantity, from, to);
  } catch {
    return null;
  }
}

export function areUnitsConvertible(fromUnit?: string | null, toUnit?: string | null): boolean {
  if (!fromUnit || !toUnit) return false;

  try {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);
    return getUnitCategory(from) === getUnitCategory(to);
  } catch {
    return false;
  }
}

export function describeQuantityForComparison(quantity: number, unit: string): DisplayAmount {
  return normalizeAmountForDisplay(quantity, unit);
}

export function validateUnitConversion(quantity: number, fromUnit: string, toUnit: string): {
  valid: boolean;
  convertedQuantity?: number;
  category?: UnitCategory;
} {
  if (!Number.isFinite(quantity)) {
    return { valid: false };
  }

  try {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);
    const category = getUnitCategory(from);

    if (category !== getUnitCategory(to)) {
      return { valid: false };
    }

    return {
      valid: true,
      convertedQuantity: convert(quantity, from, to),
      category,
    };
  } catch {
    return { valid: false };
  }
}
