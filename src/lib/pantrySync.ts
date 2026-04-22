import { Prisma, PrismaClient } from '@prisma/client';
import { convert, normalizeUnit } from './units';

function normalizeLooseUnit(raw?: string | null) {
  return (raw ?? '').trim().toLowerCase();
}

function convertWithBestEffort(value: number, fromUnit?: string | null, toUnit?: string | null) {
  const fromRaw = normalizeLooseUnit(fromUnit);
  const toRaw = normalizeLooseUnit(toUnit);

  if (!fromRaw || !toRaw || fromRaw === toRaw) return value;

  try {
    const from = normalizeUnit(fromRaw);
    const to = normalizeUnit(toRaw);
    return convert(value, from, to);
  } catch {
    return null;
  }
}

function unitsDiffer(fromUnit?: string | null, toUnit?: string | null) {
  const fromRaw = normalizeLooseUnit(fromUnit);
  const toRaw = normalizeLooseUnit(toUnit);
  return !!fromRaw && !!toRaw && fromRaw !== toRaw;
}

async function ensureDefaultPantry(prisma: Prisma.TransactionClient, owner: string) {
  const location = await prisma.location.upsert({
    where: { name_owner: { name: 'Default Pantry', owner } },
    update: {},
    create: { name: 'Default Pantry', owner },
  });

  const storage = await prisma.storage.upsert({
    where: { name_locationId: { name: 'Default Shelf', locationId: location.id } },
    update: {},
    create: { name: 'Default Shelf', locationId: location.id },
  });

  return { locationId: location.id, storageId: storage.id };
}

export async function syncShoppingItemPurchaseToPantry(
  prisma: PrismaClient,
  shoppingListItemId: number,
  purchased: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.shoppingListItem.findUnique({
      where: { id: shoppingListItemId },
      include: { shoppingList: true },
    });

    if (!item) throw new Error('Item not found');
    if (item.shoppingList.isCompleted) {
      throw new Error('Completed shopping lists are locked and cannot be edited.');
    }

    if (item.purchased === purchased) return item;

    const { locationId, storageId } = await ensureDefaultPantry(tx, item.shoppingList.owner);
    const existingProduce = await tx.produce.findUnique({
      where: { name_owner: { name: item.name, owner: item.shoppingList.owner } },
    });

    if (purchased) {
      if (!existingProduce) {
        await tx.produce.create({
          data: {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            type: 'Other',
            owner: item.shoppingList.owner,
            locationId,
            storageId,
          },
        });
      } else {
        const converted = convertWithBestEffort(item.quantity, item.unit, existingProduce.unit);
        if (converted == null && unitsDiffer(item.unit, existingProduce.unit)) {
          throw new Error(
            `Cannot add ${item.name}: incompatible units `
            + `(${item.unit || 'unknown'} -> ${existingProduce.unit || 'unknown'}).`,
          );
        }
        const incrementBy = converted ?? item.quantity;
        await tx.produce.update({
          where: { id: existingProduce.id },
          data: { quantity: existingProduce.quantity + incrementBy },
        });
      }
    } else if (existingProduce) {
      const converted = convertWithBestEffort(item.quantity, item.unit, existingProduce.unit);
      if (converted == null && unitsDiffer(item.unit, existingProduce.unit)) {
        throw new Error(
          `Cannot subtract ${item.name}: incompatible units `
          + `(${item.unit || 'unknown'} -> ${existingProduce.unit || 'unknown'}).`,
        );
      }
      const decrementBy = converted ?? item.quantity;
      await tx.produce.update({
        where: { id: existingProduce.id },
        data: { quantity: Math.max(existingProduce.quantity - decrementBy, 0) },
      });
    }

    const updated = await tx.shoppingListItem.update({
      where: { id: shoppingListItemId },
      data: {
        purchased,
        purchasedAt: purchased ? new Date() : null,
      },
    });

    return updated;
  });
}
