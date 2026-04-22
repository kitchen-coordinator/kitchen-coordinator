export type UnitCategory = 'mass' | 'volume' | 'count';

export const MASS_UNITS = ['g', 'kg', 'mg', 'lb', 'oz'] as const;
export const VOLUME_UNITS = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl_oz'] as const;
export const COUNT_UNITS = ['pcs'] as const;

export const ALL_UNITS = [...MASS_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS] as const;
export type Unit = typeof ALL_UNITS[number];

// Base units per category.
export const BASE_UNIT: Record<UnitCategory, Unit> = {
  mass: 'g',
  volume: 'ml',
  count: 'pcs',
};

// Map each canonical unit to a category.
const UNIT_CATEGORY: Record<Unit, UnitCategory> = {
  g: 'mass',
  kg: 'mass',
  mg: 'mass',
  lb: 'mass',
  oz: 'mass',

  ml: 'volume',
  l: 'volume',
  tsp: 'volume',
  tbsp: 'volume',
  cup: 'volume',
  fl_oz: 'volume',

  pcs: 'count',
};

// Conversion factors to the category base unit.
const TO_BASE: Record<Unit, number> = {
  // Mass -> grams
  g: 1,
  kg: 1000,
  mg: 0.001,
  lb: 453.59237,
  oz: 28.349523125,

  // Volume -> milliliters
  ml: 1,
  l: 1000,
  tsp: 4.92892159375,
  tbsp: 14.78676478125,
  cup: 236.5882365,
  fl_oz: 29.5735295625,

  pcs: 1,
};

// List of Aliases that can be used
const ALIASES: Record<string, Unit> = {
  // Mass
  gram: 'g',
  grams: 'g',
  g: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  kg: 'kg',
  milligram: 'mg',
  milligrams: 'mg',
  mg: 'mg',
  pound: 'lb',
  pounds: 'lb',
  lb: 'lb',
  lbs: 'lb',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',

  // Volume
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  'fl oz': 'fl_oz',
  floz: 'fl_oz',
  fl_oz: 'fl_oz',

  // Count
  pc: 'pcs',
  pcs: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  count: 'pcs',
};

export function isUnit(x: string): x is Unit {
  return (ALL_UNITS as readonly string[]).includes(x);
}

export function normalizeUnit(input: string): Unit {
  const key = input.trim().toLowerCase().replace(/\s+/g, ' ');
  const unit = ALIASES[key];
  if (!unit) throw new Error(`Unsupported unit: ${input}`);
  return unit;
}

export function getUnitCategory(unit: Unit): UnitCategory {
  return UNIT_CATEGORY[unit];
}

export function toBase(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) throw new Error('Value must be a finite number');
  if (value < 0) throw new Error('Value cannot be negative');
  return value * TO_BASE[unit];
}

export function fromBase(baseValue: number, unit: Unit): number {
  if (!Number.isFinite(baseValue)) throw new Error('Value must be a finite number');
  if (baseValue < 0) throw new Error('Value cannot be negative');
  return baseValue / TO_BASE[unit];
}

/**
 * Convert between two units in the SAME category.
 *
 */
export function convert(value: number, fromUnit: Unit, toUnit: Unit): number {
  const fromCat = getUnitCategory(fromUnit);
  const toCat = getUnitCategory(toUnit);
  if (fromCat !== toCat) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit} (different unit categories)`);
  }
  const base = toBase(value, fromUnit);
  return fromBase(base, toUnit);
}
