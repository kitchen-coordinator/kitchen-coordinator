import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

type IncomingItem =
  | string
  | {
    name?: string;
    quantity?: number | string | null;
    unit?: string | null;
  };

type NormalizedItem = {
  name: string;
  quantity: number;
  unit: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const body = await request.json();

    let rawItems: IncomingItem[] = [];

    // Bulk: body.items (can be strings OR objects)
    if (Array.isArray(body.items)) {
      rawItems = body.items;
    // Single: body.name (+ optional quantity/unit)
    } else if (body.name) {
      rawItems = [body];
    } else {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 },
      );
    }

    // Normalize into { name, quantity, unit }
    const normalizedItems: NormalizedItem[] = rawItems
      .map((item) => {
        // Allow legacy string form
        if (typeof item === 'string') {
          const name = item.trim();
          if (!name) return null;
          return {
            name,
            quantity: 1, // default quantity
            unit: null,
          };
        }

        const name = String(item.name ?? '').trim();
        if (!name) return null;

        const rawQty = item.quantity;
        let quantity: number;

        if (rawQty == null || rawQty === '') {
          quantity = 1; // default 1 if not provided
        } else {
          const num = Number(rawQty);
          quantity = Number.isFinite(num) && num > 0 ? num : 1;
        }

        const unit = typeof item.unit === 'string' && item.unit.trim().length > 0
          ? item.unit.trim()
          : null;

        return {
          name,
          quantity,
          unit,
        };
      })
      .filter((v): v is NormalizedItem => v !== null);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to add' },
        { status: 400 },
      );
    }

    // Find or create shopping list for this user
    // Dedupe by item name (prevents same-name duplicates within the request)
    const normalizedUniqueItems = Array.from(
      new Map(normalizedItems.map((i) => [i.name, i] as const)).values(),

    // Optional targeting: add to selected list(s) or create a new list name first.
    let requestedListIdsRaw: unknown[] = [];
      requestedListIdsRaw = body.shoppingListIds;
    } else if (body.shoppingListId != null) {
      requestedListIdsRaw = [body.shoppingListId];
    }

    const requestedListIds: number[] = Array.from(
      new Set(
        requestedListIdsRaw
          .map((n: unknown) => Number(n))
          .filter((n): n is number => Number.isFinite(n)),
      ),
    );

    const createShoppingListName = typeof body.createShoppingListName === 'string'
      ? body.createShoppingListName.trim()
      : '';

    const hasExplicitTargets = requestedListIds.length > 0 || createShoppingListName.length > 0;

    const listIdsToProcess: number[] = [];
    let createdListId: number | null = null;

    if (!hasExplicitTargets) {
      // Backward-compatible behavior: use the latest open list (or create one).
      let shoppingList = await prisma.shoppingList.findFirst({
        where: { owner: email, isCompleted: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!shoppingList) {
        shoppingList = await prisma.shoppingList.create({
          data: { name: 'My Shopping List', owner: email, isCompleted: false },
        });
      }

      listIdsToProcess.push(shoppingList.id);
    } else {
      // Validate explicitly provided list ids.
      if (requestedListIds.length > 0) {
        const found = await prisma.shoppingList.findMany({
          where: { id: { in: requestedListIds }, owner: email },
          select: { id: true, isCompleted: true },
        });

        if (found.length !== requestedListIds.length) {
          const foundIds = new Set(found.map((l) => l.id));
          const missingListIds = requestedListIds.filter((id) => !foundIds.has(id));
          return NextResponse.json(
            { error: 'One or more selected shopping lists are invalid.', missingListIds },
            { status: 400 },
          );
        }

        const completedListIds = found.filter((l) => l.isCompleted).map((l) => l.id);
        if (completedListIds.length > 0) {
          return NextResponse.json(
            {
              error: 'Completed shopping lists are locked and cannot be edited.',
              completedListIds,
            },
            { status: 400 },
          );
        }

        listIdsToProcess.push(...requestedListIds);
      }

      // Create shopping list if requested.
      if (createShoppingListName.length > 0) {
        const existing = await prisma.shoppingList.findUnique({
          where: { name_owner: { name: createShoppingListName, owner: email } },
          select: { id: true, isCompleted: true },
        });

        if (existing) {
          if (existing.isCompleted) {
            return NextResponse.json(
              {
                error: 'A completed shopping list with this name exists and cannot be edited.',
                existingListId: existing.id,
              },
              { status: 400 },
            );
          }

          return NextResponse.json(
            {
              error: 'A shopping list with this name already exists.',
              existingListId: existing.id,
            },
            { status: 409 },
          );
        }

        const created = await prisma.shoppingList.create({
          data: { name: createShoppingListName, owner: email, isCompleted: false },
          select: { id: true },
        });
        createdListId = created.id;
        listIdsToProcess.push(createdListId);
      }
    }

    const uniqueListIdsToProcess = Array.from(new Set(listIdsToProcess));

    if (uniqueListIdsToProcess.length === 0) {
      return NextResponse.json({ error: 'No shopping lists selected.' }, { status: 400 });
    }

    // Fetch existing items for all targeted lists in one query.
    const existingItems = await prisma.shoppingListItem.findMany({
      where: { shoppingListId: { in: uniqueListIdsToProcess } },
      select: { shoppingListId: true, name: true },
    });

    const existingNamesByListId = new Map<number, Set<string>>();
    for (const listId of uniqueListIdsToProcess) {
      existingNamesByListId.set(listId, new Set());
    }
    for (const i of existingItems) {
      existingNamesByListId.get(i.shoppingListId)?.add(i.name);
    }

    const results = await Promise.all(
      uniqueListIdsToProcess.map(async (listId) => {
        const existingNames = existingNamesByListId.get(listId) ?? new Set<string>();
        const itemsToInsert = normalizedUniqueItems.filter((item) => !existingNames.has(item.name));

        if (itemsToInsert.length === 0) {
          return { shoppingListId: listId, created: [] as { id: number; name: string }[] };
        }

        await prisma.shoppingListItem.createMany({
          data: itemsToInsert.map((item) => ({
            shoppingListId: listId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });

        const createdItems = await prisma.shoppingListItem.findMany({
          where: {
            shoppingListId: listId,
            name: { in: itemsToInsert.map((i) => i.name) },
          },
          select: { id: true, name: true },
        });

        return { shoppingListId: listId, created: createdItems };
      }),
    );

    const createdByList = results;
    const flatCreated = results.flatMap((r) => r.created);

    return NextResponse.json({
      success: true,
      createdByList,
      created: flatCreated, // backward-compatible field for existing clients
      totalCreated: flatCreated.length,
      createdListId,
    });
  } catch (error) {
    console.error('Error adding shopping list items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
