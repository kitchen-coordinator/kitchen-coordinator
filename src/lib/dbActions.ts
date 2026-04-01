'use server';

import { getUnitCategory, normalizeUnit } from '@/lib/units';
import { Prisma } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { completeShoppingListAndSyncPantry } from './shoppingListCompletion';

function isMassOrVolumeUnit(unit: string) {
  const category = getUnitCategory(normalizeUnit(unit));
  return category === 'mass' || category === 'volume';
}

function normalizeDisplayUnit(unit: string) {
  return unit.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function resolveProduceUnits(params: {
  owner: string;
  quantity: number;
  unit: string;
  restockThreshold?: number;
  commonItemId?: number | null;
}) {
  const { owner, quantity, unit, restockThreshold, commonItemId } = params;

  if (!commonItemId) {
    const normalizedUnit = normalizeUnit(unit);
    return {
      quantity: Number(quantity),
      unit: normalizedUnit,
      displayQuantity: null as number | null,
      displayUnit: null as string | null,
      restockThreshold: typeof restockThreshold === 'number' ? restockThreshold : 0,
    };
  }

  const commonItem = await prisma.commonItem.findUnique({
    where: { id: commonItemId },
  });

  if (!commonItem) {
    throw new Error('Selected common item was not found.');
  }

  if (commonItem.owner !== owner) {
    throw new Error('You do not have access to that common item.');
  }

  const displayUnit = normalizeDisplayUnit(unit);
  const commonDisplayUnit = normalizeDisplayUnit(commonItem.displayUnit);
  if (displayUnit !== commonDisplayUnit) {
    throw new Error(`Unit must match the selected common item display unit: ${commonItem.displayUnit}`);
  }

  const normalizedQuantity = Number(quantity) * Number(commonItem.normalizedQuantityPerUnit);
  const normalizedThreshold = typeof restockThreshold === 'number'
    ? Number(restockThreshold) * Number(commonItem.normalizedQuantityPerUnit)
    : 0;

  return {
    quantity: normalizedQuantity,
    unit: commonItem.normalizedUnit,
    displayQuantity: Number(quantity),
    displayUnit: commonItem.displayUnit,
    restockThreshold: normalizedThreshold,
  };
}

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
  commonItemId?: number | null;
}) {
  const quantityInput = Number(produce.quantity);

  const location = await prisma.location.upsert({
    where: { name_owner: { name: produce.location, owner: produce.owner } },
    update: {},
    create: { name: produce.location, owner: produce.owner },
  });

  const storage = await prisma.storage.upsert({
    where: { name_locationId: { name: produce.storage, locationId: location.id } },
    update: {},
    create: { name: produce.storage, locationId: location.id },
  });

  const resolved = await resolveProduceUnits({
    owner: produce.owner,
    quantity: quantityInput,
    unit: produce.unit,
    restockThreshold: produce.restockThreshold,
    commonItemId: produce.commonItemId,
  });

  const newProduce = await prisma.produce.upsert({
    where: { name_owner: { name: produce.name, owner: produce.owner } },
    update: {
      type: produce.type,
      locationId: location.id,
      storageId: storage.id,
      quantity: resolved.quantity,
      unit: resolved.unit,
      displayQuantity: resolved.displayQuantity,
      displayUnit: resolved.displayUnit,
      expiration: produce.expiration ? new Date(produce.expiration) : null,
      image: produce.image ?? null,
      restockThreshold: resolved.restockThreshold,
      commonItemId: produce.commonItemId ?? null,
    },
    create: {
      name: produce.name,
      type: produce.type,
      owner: produce.owner,
      locationId: location.id,
      storageId: storage.id,
      quantity: resolved.quantity,
      unit: resolved.unit,
      displayQuantity: resolved.displayQuantity,
      displayUnit: resolved.displayUnit,
      expiration: produce.expiration ? new Date(produce.expiration) : null,
      image: produce.image ?? null,
      restockThreshold: resolved.restockThreshold,
      commonItemId: produce.commonItemId ?? null,
    },
  });

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

  return newProduce;
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
    commonItemId?: number | null;
  },
) {
  if (typeof produce.unit !== 'string') {
    throw new Error('Unit must be provided as a string');
  }

  const getNumeric = (v: unknown): number | undefined => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'set' in (v as Record<string, unknown>)) {
      const s = (v as { set?: unknown }).set;
      if (typeof s === 'number') return s;
    }
    return undefined;
  };

  const quantityInput = getNumeric(produce.quantity);
  if (quantityInput === undefined) {
    throw new Error('Quantity must be a number');
  }

  const restockInput = getNumeric(produce.restockThreshold);

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

  const resolved = await resolveProduceUnits({
    owner: produce.owner,
    quantity: quantityInput,
    unit: produce.unit,
    restockThreshold: restockInput,
    commonItemId: produce.commonItemId,
  });

  const updatedProduce = await prisma.produce.update({
    where: { id: produce.id },
    data: {
      name: produce.name,
      type: produce.type,
      locationId: location.id,
      storageId: storage.id,
      quantity: resolved.quantity,
      unit: resolved.unit,
      displayQuantity: resolved.displayQuantity,
      displayUnit: resolved.displayUnit,
      expiration,
      owner: produce.owner,
      image: produce.image,
      restockThreshold: resolved.restockThreshold,
      commonItemId: produce.commonItemId ?? null,
    },
  });

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
  const deleted = await prisma.produce.delete({
    where: { id },
  });
  return deleted;
}

export async function getUserProduceByEmail(owner: string) {
  return prisma.produce.findMany({
    where: { owner },
    select: { name: true },
  });
}

export async function getUserProduceWithQuantity(owner: string) {
  return prisma.produce.findMany({
    where: { owner },
    select: { id: true, name: true, quantity: true, unit: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Adds a new location.
 */
export async function addLocation(location: { name: string; owner: string }) {
  const name = location.name.trim();
  const owner = location.owner.trim();

  const newLocation = await prisma.location.upsert({
    where: { name_owner: { name, owner } },
    update: {},
    create: { name, owner },
  });

  return newLocation;
}

/**
 * Adds a new shopping list.
 */
export async function addShoppingList(data: {
  name: string;
  owner: string
  deadline?: string | null;
  location?: string | null;
  budgetLimit?: number | null;
}) {
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
    data: {
      name,
      owner,
      isCompleted: false,
      deadline: data.deadline ? new Date(data.deadline) : null,
      location: data.location?.trim() || null,
      budgetLimit: data.budgetLimit ?? null,
    },
  });
}

/**
 * Edits an existing shopping list.
 */
export async function editShoppingList(list: Prisma.ShoppingListUpdateInput & { id: number }) {
  const existingList = await prisma.shoppingList.findUnique({
    where: { id: list.id },
    select: { isCompleted: true },
  });

  if (!existingList) {
    throw new Error('Shopping list not found.');
  }

  if (existingList.isCompleted) {
    throw new Error('Completed shopping lists are locked and cannot be edited.');
  }

  const updatedList = await prisma.shoppingList.update({
    where: { id: list.id },
    data: {
      name: list.name,
      owner: list.owner,
      deadline: list.deadline,
      location: list.location,
      budgetLimit: list.budgetLimit,
    },
  });

  return updatedList;
}

/**
 * Deletes a shopping list and its items.
 */
export async function deleteShoppingList(id: number) {
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
  const list = await prisma.shoppingList.findUnique({
    where: { id: data.shoppingListId },
    select: { isCompleted: true },
  });

  if (!list) {
    throw new Error('Shopping list not found.');
  }

  if (list.isCompleted) {
    throw new Error('Completed shopping lists are locked and cannot be edited.');
  }

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
  const existingItem = await prisma.shoppingListItem.findUnique({
    where: { id: item.id },
    include: { shoppingList: { select: { isCompleted: true } } },
  });

  if (!existingItem) {
    throw new Error('Shopping list item not found.');
  }

  if (existingItem.shoppingList.isCompleted) {
    throw new Error('Completed shopping lists are locked and cannot be edited.');
  }

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
  const existingItem = await prisma.shoppingListItem.findUnique({
    where: { id },
    include: { shoppingList: { select: { isCompleted: true } } },
  });

  if (!existingItem) {
    throw new Error('Shopping list item not found.');
  }

  if (existingItem.shoppingList.isCompleted) {
    throw new Error('Completed shopping lists are locked and cannot be edited.');
  }

  await prisma.shoppingListItem.delete({
    where: { id },
  });
}

export async function getCommonItemsByOwner(owner: string) {
  const normalizedOwner = owner.trim();
  if (!normalizedOwner) return [];

  return prisma.commonItem.findMany({
    where: { owner: normalizedOwner },
    orderBy: [{ name: 'asc' }, { displayUnit: 'asc' }],
  });
}

export async function addCommonItem(data: {
  owner: string;
  name: string;
  displayUnit: string;
  normalizedQuantityPerUnit: number;
  normalizedUnit: string;
}) {
  const owner = data.owner.trim();
  const name = data.name.trim();
  const displayUnit = normalizeDisplayUnit(data.displayUnit);
  const normalizedQuantityPerUnit = Number(data.normalizedQuantityPerUnit);
  const normalizedUnit = normalizeUnit(data.normalizedUnit);

  if (!owner) throw new Error('Owner is required.');
  if (!name) throw new Error('Common item name is required.');
  if (!displayUnit) throw new Error('Display unit is required.');
  if (!Number.isFinite(normalizedQuantityPerUnit) || normalizedQuantityPerUnit <= 0) {
    throw new Error('Normalized quantity must be greater than 0.');
  }
  if (!isMassOrVolumeUnit(normalizedUnit)) {
    throw new Error('Normalized unit must be a mass or volume unit.');
  }

  const duplicate = await prisma.commonItem.findFirst({
    where: {
      owner,
      name: { equals: name, mode: 'insensitive' },
      displayUnit: { equals: displayUnit, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error('You already saved this common item with that display unit.');
  }

  return prisma.commonItem.create({
    data: {
      owner,
      name,
      displayUnit,
      normalizedQuantityPerUnit,
      normalizedUnit,
    },
  });
}

export async function completeShoppingList(shoppingListId: number) {
  return completeShoppingListAndSyncPantry(prisma, shoppingListId);
}
