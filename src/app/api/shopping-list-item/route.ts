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
    let shoppingList = await prisma.shoppingList.findFirst({
      where: { owner: email, isCompleted: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!shoppingList) {
      shoppingList = await prisma.shoppingList.create({
        data: { name: 'My Shopping List', owner: email, isCompleted: false },
      });
    }

    // Fetch existing items (by name) for this list once
    const existingItems = await prisma.shoppingListItem.findMany({
      where: { shoppingListId: shoppingList.id },
      select: { name: true },
    });

    const existingNames = new Set(existingItems.map((i) => i.name));

    // Filter out duplicates by name
    const itemsToInsert = normalizedItems.filter(
      (item) => !existingNames.has(item.name),
    );

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ success: true, created: [] });
    }

    // Insert all at once, carrying quantity & unit
    await prisma.shoppingListItem.createMany({
      data: itemsToInsert.map((item) => ({
        shoppingListId: shoppingList.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
    });

    // Fetch newly created items to return ids + names
    const createdItems = await prisma.shoppingListItem.findMany({
      where: {
        shoppingListId: shoppingList.id,
        name: { in: itemsToInsert.map((i) => i.name) },
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, created: createdItems });
  } catch (error) {
    console.error('Error adding shopping list items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
