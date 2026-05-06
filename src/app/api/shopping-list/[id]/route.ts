import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeShoppingListAndSyncPantry } from '@/lib/shoppingListCompletion';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const list = await prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    return NextResponse.json(list, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const body = await request.json();

    const existing = await prisma.shoppingList.findUnique({
      where: { id },
      select: { id: true, isCompleted: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    if (existing.isCompleted) {
      return NextResponse.json(
        { error: 'Completed shopping lists are locked and cannot be edited.' },
        { status: 400 },
      );
    }

    if (body.complete === true) {
      const completed = await completeShoppingListAndSyncPantry(prisma, id);
      return NextResponse.json(completed, { status: 200 });
    }

    // Build update data from any provided fields
    const updateData: Record<string, any> = {};

    if (typeof body.name === 'string') updateData.name = body.name.trim();
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.budgetLimit !== undefined) {
      updateData.budgetLimit = body.budgetLimit !== null ? Number(body.budgetLimit) : null;
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
    }

    const updated = await prisma.shoppingList.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating shopping list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
