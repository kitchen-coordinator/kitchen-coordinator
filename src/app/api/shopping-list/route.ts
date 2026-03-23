import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/shopping-list
export async function POST(req: Request) {
  try {
    const { name, quantity, unit, owner } = await req.json();

    if (!name || !owner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create default shopping list
    const shoppingList = await prisma.shoppingList.upsert({
      where: {
        name_owner: {
          name: 'Auto Restock',
          owner,
        },
      },
      update: {},
      create: {
        name: 'Auto Restock',
        owner,
      },
    });

    // Prevent duplicates
    const existing = await prisma.shoppingListItem.findFirst({
      where: {
        shoppingListId: shoppingList.id,
        name,
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Item already exists' }, { status: 200 });
    }

    // Add item
    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: shoppingList.id,
        name,
        quantity: Number(quantity) || 1,
        unit: unit || '',
        price: null,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

// GET /api/shopping-list
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');

  // validate owner parameter
  if (!owner) {
    return NextResponse.json(
      { error: 'Owner parameter is required' },
      { status: 400 },
    );
  }

  // fetch shopping list or throw error if not found
  try {
    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        owner,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ shoppingLists });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 },
    );
  }
}
