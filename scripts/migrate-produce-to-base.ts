// ONE-TIME MIGRATION
import { prisma } from '../src/lib/prisma';
import { BASE_UNIT, getUnitCategory, normalizeUnit, toBase } from '../src/lib/units';

async function main() {
  const rows = await prisma.produce.findMany({
    select: { id: true, unit: true, quantity: true, restockThreshold: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const p of rows) {
    try {
      const normalized = normalizeUnit(p.unit);
      const cat = getUnitCategory(normalized);
      const baseUnit = BASE_UNIT[cat];

      const quantityBase = toBase(p.quantity ?? 0, normalized);
      const restockBase = typeof p.restockThreshold === 'number' ? toBase(p.restockThreshold, normalized) : null;

      // eslint-disable-next-line no-await-in-loop
      await prisma.produce.update({
        where: { id: p.id },
        data: {
          unit: baseUnit,
          quantity: quantityBase,
          restockThreshold: restockBase ?? 0,
        },
      });
      updated += 1;
    } catch (e) {
      skipped += 1;
      // eslint-disable-next-line no-console
      console.warn(`Skipping produce id=${p.id} unit='${p.unit}': ${(e as Error).message}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Updated ${updated} rows. Skipped ${skipped} rows.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
