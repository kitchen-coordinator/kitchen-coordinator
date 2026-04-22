import { Prisma, PrismaClient } from '@prisma/client';

const MASS_CONVERSIONS_TO_GRAM: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

const VOLUME_CONVERSIONS_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  tsp: 4.92892,
  teaspoon: 4.92892,
  teaspoons: 4.92892,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tablespoons: 14.7868,
  cup: 236.588,
  cups: 236.588,
  floz: 29.5735,
  'fl oz': 29.5735,
  pint: 473.176,
  pints: 473.176,
  quart: 946.353,
  quarts: 946.353,
  gallon: 3785.41,
  gallons: 3785.41,
};

const COUNT_UNITS = new Set(['unit', 'units', 'each', 'item', 'items', 'pc', 'pcs', 'piece', 'pieces']);

function normalizeUnit(raw?: string | null) {
  return (raw ?? '').trim().toLowerCase();
}

function convertQuantity(value: number, fromUnit?: string | null, toUnit?: string | null): number | null {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (!normalizedTo || normalizedFrom === normalizedTo || !normalizedFrom) return value;

  const fromMassFactor = MASS_CONVERSIONS_TO_GRAM[normalizedFrom];
  const toMassFactor = MASS_CONVERSIONS_TO_GRAM[normalizedTo];
  if (fromMassFactor && toMassFactor) {
    return (value * fromMassFactor) / toMassFactor;
  }

  const fromVolumeFactor = VOLUME_CONVERSIONS_TO_ML[normalizedFrom];
  const toVolumeFactor = VOLUME_CONVERSIONS_TO_ML[normalizedTo];
  if (fromVolumeFactor && toVolumeFactor) {
    return (value * fromVolumeFactor) / toVolumeFactor;
  }

  if (COUNT_UNITS.has(normalizedFrom) && COUNT_UNITS.has(normalizedTo)) {
    return value;
  }

  return null;
}

async function getDefaultPantryLocationAndStorage(tx: Prisma.TransactionClient, owner: string) {
  const location = await tx.location.upsert({
    where: { name_owner: { name: 'Default Pantry', owner } },
    update: {},
    create: { name: 'Default Pantry', owner },
  });

  const storage = await tx.storage.upsert({
    where: { name_locationId: { name: 'Default Shelf', locationId: location.id } },
    update: {},
    create: { name: 'Default Shelf', locationId: location.id },
  });

  return { location, storage };
}

export async function completeShoppingListAndSyncPantry(prisma: PrismaClient, shoppingListId: number) {
  return prisma.$transaction(async (tx) => {
    const shoppingList = await tx.shoppingList.findUnique({
      where: { id: shoppingListId },
      include: { items: true },
    });

    if (!shoppingList) {
      throw new Error('Shopping list not found.');
    }

    if (shoppingList.isCompleted) {
      return shoppingList;
    }

    const { location, storage } = await getDefaultPantryLocationAndStorage(tx, shoppingList.owner);

    const purchasedItems = shoppingList.items.filter((item) => item.purchased);

    await Promise.all(purchasedItems.map(async (item) => {
      const existingProduce = await tx.produce.findUnique({
        where: {
          name_owner: {
            name: item.name,
            owner: shoppingList.owner,
          },
        },
      });

      if (!existingProduce) {
        await tx.produce.create({
          data: {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'unit',
            type: 'Other',
            owner: shoppingList.owner,
            locationId: location.id,
            storageId: storage.id,
          },
        });
        return;
      }

      const quantityInInventoryUnit = convertQuantity(item.quantity, item.unit, existingProduce.unit);
      const incrementBy = quantityInInventoryUnit ?? item.quantity;

      await tx.produce.update({
        where: { id: existingProduce.id },
        data: {
          quantity: existingProduce.quantity + incrementBy,
        },
      });
    }));

    await tx.shoppingList.update({
      where: { id: shoppingList.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return tx.shoppingList.findUnique({
      where: { id: shoppingList.id },
      include: { items: true },
    });
  });
}
