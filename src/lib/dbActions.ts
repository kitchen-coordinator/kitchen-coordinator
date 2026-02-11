'use server';

import { normalizeUnit } from '@/lib/units';
import { Prisma } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

/**
 * Creates a new user.
 */
export async function createUser({ email, password }: { email: string; password: string }) {
  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  return user;
}

/**
 * Changes a user's password, checking the old password.
 */
export async function changePassword({
  email,
  oldPassword,
  newPassword,
}: {
  email: string;
  oldPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const match = await compare(oldPassword, user.password);
  if (!match) {
    return { success: false, message: 'Old password is incorrect.' };
  }

  if (oldPassword === newPassword) {
    return { success: false, message: 'New password must be different from old password.' };
  }

  if (newPassword.length < 6 || newPassword.length > 40) {
    return { success: false, message: 'Password must be between 6 and 40 characters.' };
  }

  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { success: true };
}

/**
 * Adds a new produce.
 */
export async function addProduce(produce: {
  name: string;
  type: string;
  location: string;
  storage: string;
  quantity: number;
  unit: string;
  expiration: string | Date | null;
  owner: string;
  image: string | null;
  restockThreshold?: number;
}) {
  const normalizedUnit = normalizeUnit(produce.unit);
  const quantityStored = produce.quantity;
  const restockThresholdStored = typeof produce.restockThreshold === 'number' ? produce.restockThreshold : 0;

  // Note: restockThreshold is assumed to be in the SAME unit as quantity.

  // Upsert or find Location by name + owner
  const location = await prisma.location.upsert({
    where: { name_owner: { name: produce.location, owner: produce.owner } },
    update: {},
    create: { name: produce.location, owner: produce.owner },
  });

  // Upsert or find Storage by name + locationId
  const storage = await prisma.storage.upsert({
    where: { name_locationId: { name: produce.storage, locationId: location.id } },
    update: {},
    create: { name: produce.storage, locationId: location.id },
  });

  // Create or update Produce, linking by IDs
  const newProduce = await prisma.produce.upsert({
    where: { name_owner: { name: produce.name, owner: produce.owner } },
    update: {
      type: produce.type,
      locationId: location.id,
      storageId: storage.id,
      quantity: quantityStored,
      unit: normalizedUnit,
      expiration: produce.expiration ? new Date(produce.expiration) : null,
      image: produce.image ?? null,
      restockThreshold: restockThresholdStored,
    },
    create: {
      name: produce.name,
      type: produce.type,
      owner: produce.owner,
      locationId: location.id,
      storageId: storage.id,
      quantity: quantityStored,
      unit: normalizedUnit,
      expiration: produce.expiration ? new Date(produce.expiration) : null,
      image: produce.image ?? null,
      restockThreshold: restockThresholdStored,
    },
  });

  // Auto-add to shopping list if below threshold
  if (newProduce.restockThreshold !== null && newProduce.quantity <= newProduce.restockThreshold) {
    const shoppingList = await prisma.shoppingList.upsert({
      where: { name_owner: { name: 'Auto Restock', owner: newProduce.owner } },
      update: {},
      create: { name: 'Auto Restock', owner: newProduce.owner },
    });

    const existingItem = await prisma.shoppingListItem.findFirst({
      where: {
        shoppingListId: shoppingList.id,
        name: newProduce.name,
      },
    });

    if (!existingItem) {
      await prisma.shoppingListItem.create({
        data: {
          shoppingListId: shoppingList.id,
          name: newProduce.name,
          quantity: newProduce.restockThreshold ?? 1,
          unit: newProduce.unit,
          price: null,
        },
      });
    }
  }

  redirect('/view-pantry');
}

/**
 * Edits an existing produce.
 */
export async function editProduce(
  produce: Prisma.ProduceUpdateInput & {
    id: number;
    location: string;
    storage: string;
    owner: string;
  },
) {
  // OPTION SAME SAME: Normalizes and determines the unit type
  // Check if a String
  if (typeof produce.unit !== 'string') {
    throw new Error('Unit must be provided as a string');
  }
  // Normalize unit (store user-entered unit; convert only when needed)
  const normalizedUnit = normalizeUnit(produce.unit);

  const getNumeric = (v: unknown): number | undefined => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'set' in (v as Record<string, unknown>)) {
      const s = (v as { set?: unknown }).set;
      if (typeof s === 'number') return s;
    }
    return undefined;
  };
  // Converts to base units
  const quantityInput = getNumeric(produce.quantity);
  if (quantityInput === undefined) {
    throw new Error('Quantity must be a number');
  }
  const quantityStored = quantityInput;
  // Gets restock amount and converts to base unit
  const restockInput = getNumeric(produce.restockThreshold);
  const restockThresholdStored = typeof restockInput === 'number' ? restockInput : 0;
  // Find or create location and storage first
  const location = await prisma.location.upsert({
    where: { name_owner: { name: produce.location as string, owner: produce.owner as string } },
    update: {},
    create: { name: produce.location as string, owner: produce.owner as string },
  });

  const storage = await prisma.storage.upsert({
    where: { name_locationId: { name: produce.storage as string, locationId: location.id } },
    update: {},
    create: { name: produce.storage as string, locationId: location.id },
  });

  // Handle expiration
  let expiration: Date | Prisma.DateTimeFieldUpdateOperationsInput | null | undefined = null;
  if (produce.expiration) {
    if (produce.expiration instanceof Date) {
      expiration = produce.expiration;
    } else if (typeof produce.expiration === 'string' || typeof produce.expiration === 'number') {
      expiration = new Date(produce.expiration);
    } else {
      expiration = produce.expiration as Prisma.DateTimeFieldUpdateOperationsInput;
    }
  }

  // Update produce linking new IDs
  const updatedProduce = await prisma.produce.update({
    where: { id: produce.id },
    data: {
      name: produce.name,
      type: produce.type,
      locationId: location.id,
      storageId: storage.id,
      quantity: quantityStored,
      unit: normalizedUnit,
      expiration,
      owner: produce.owner,
      image: produce.image,
      restockThreshold: restockThresholdStored,
    },
  });

  // Auto-add to shopping list if below threshold
  if (updatedProduce.restockThreshold !== null && updatedProduce.quantity <= updatedProduce.restockThreshold) {
    const shoppingList = await prisma.shoppingList.upsert({
      where: { name_owner: { name: 'Auto Restock', owner: updatedProduce.owner } },
      update: {},
      create: { name: 'Auto Restock', owner: updatedProduce.owner },
    });

    const existingItem = await prisma.shoppingListItem.findFirst({
      where: {
        shoppingListId: shoppingList.id,
        name: updatedProduce.name,
      },
    });

    if (!existingItem) {
      await prisma.shoppingListItem.create({
        data: {
          shoppingListId: shoppingList.id,
          name: updatedProduce.name,
          quantity: updatedProduce.restockThreshold ?? 1,
          unit: updatedProduce.unit,
          price: null,
        },
      });
    }
  }

  return updatedProduce;
}

/**
 * Deletes a produce by id.
 */
export async function deleteProduce(id: number) {
  await prisma.produce.delete({
    where: { id },
  });

  redirect('/view-pantry');
}

export async function getUserProduceByEmail(owner: string) {
  return prisma.produce.findMany({
    where: { owner },
    select: { name: true },
  });
}

/**
 * Adds a new location.
 */
export async function addLocation(location: { name: string; owner: string }) {
  // Normalize input (trim whitespace)
  const name = location.name.trim();
  const owner = location.owner.trim();

  // Create the location if it doesn’t already exist
  const newLocation = await prisma.location.upsert({
    where: { name_owner: { name, owner } },
    update: {}, // do nothing if exists
    create: { name, owner },
  });

  return newLocation;
}

/**
 * Adds a new shopping list.
 */
export async function addShoppingList(data: { name: string; owner: string }) {
  const name = data.name.trim();
  const owner = data.owner.trim();

  if (!name) {
    throw new Error('List name cannot be empty.');
  }

  const existing = await prisma.shoppingList.findFirst({
    where: { name, owner },
  });

  if (existing) {
    throw new Error('A list with this name already exists.');
  }

  await prisma.shoppingList.create({
    data: { name, owner },
  });
}

/**
 * Edits an existing shopping list.
 */
export async function editShoppingList(list: Prisma.ShoppingListUpdateInput & { id: number }) {
  const updatedList = await prisma.shoppingList.update({
    where: { id: list.id },
    data: {
      name: list.name,
      owner: list.owner,
    },
  });

  return updatedList;
}

/**
 * Deletes a shopping list and its items.
 */
export async function deleteShoppingList(id: number) {
  // delete items first to maintain relational integrity
  await prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: id },
  });

  await prisma.shoppingList.delete({
    where: { id },
  });

  redirect('/shopping-list');
}

/**
 * Adds a new item to a shopping list.
 */
export async function addShoppingListItem(data: {
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  shoppingListId: number;
}) {
  const item = await prisma.shoppingListItem.create({
    data: {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit || '',
      price: data.price ?? null,
      shoppingListId: data.shoppingListId,
    },
  });
  console.log('✅ Added item to shopping list:', item);
  return item;
}

/**
 * Edits a shopping list item.
 */
export async function editShoppingListItem(
  item: {
    id: number;
    name?: string;
    quantity?: number;
    unit?: string | null;
    price?: number | null;
    restockTrigger?: string | null;
    customThreshold?: number | null;
  },
) {
  const updatedItem = await prisma.shoppingListItem.update({
    where: { id: item.id },
    data: {
      ...(item.name !== undefined && { name: item.name }),
      ...(item.quantity !== undefined && { quantity: item.quantity }),
      ...(item.unit !== undefined && { unit: item.unit }),
      ...(item.price !== undefined && { price: item.price }),
      ...(item.restockTrigger !== undefined && {
        restockTrigger: item.restockTrigger,
      }),
      ...(item.customThreshold !== undefined && {
        customThreshold: item.customThreshold,
      }),
    },
  });

  return updatedItem;
}

/**
 * Deletes a shopping list item.
 */
export async function deleteShoppingListItem(id: number) {
  await prisma.shoppingListItem.delete({
    where: { id },
  });
}
