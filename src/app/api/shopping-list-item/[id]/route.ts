import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { syncShoppingItemPurchaseToPantry } from '@/lib/pantrySync';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const item = await prisma.shoppingListItem.findUnique({
      where: { id },
<<<<<<< Updated upstream
      include: { shoppingList: { select: { isCompleted: true } } },
=======
      include: { shoppingList: true },
>>>>>>> Stashed changes
    });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.shoppingList.isCompleted) {
      return NextResponse.json(
        { error: 'Completed shopping lists are locked and cannot be edited.' },
        { status: 400 },
      );
    }

    await prisma.shoppingListItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving item to pantry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
<<<<<<< Updated upstream
    const item = await prisma.shoppingListItem.findUnique({
=======
    const existingItem = await prisma.shoppingListItem.findUnique({
>>>>>>> Stashed changes
      where: { id },
      include: { shoppingList: { select: { isCompleted: true } } },
    });

<<<<<<< Updated upstream
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.shoppingList.isCompleted) {
=======
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existingItem.shoppingList.isCompleted) {
>>>>>>> Stashed changes
      return NextResponse.json(
        { error: 'Completed shopping lists are locked and cannot be edited.' },
        { status: 400 },
      );
    }

    const updatedItem = await prisma.shoppingListItem.update({
      where: { id },
      data: {
        name: body.name,
        quantity: body.quantity,
        unit: body.unit || null,
        price: body.price ?? null,
        restockTrigger: body.restockTrigger ?? null,
        customThreshold: body.customThreshold ?? null,
      },
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const body = await request.json();

<<<<<<< Updated upstream
=======
    const existingItem = await prisma.shoppingListItem.findUnique({
      where: { id },
      include: { shoppingList: { select: { isCompleted: true } } },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existingItem.shoppingList.isCompleted) {
      return NextResponse.json(
        { error: 'Completed shopping lists are locked and cannot be edited.' },
        { status: 400 },
      );
    }

>>>>>>> Stashed changes
    if (typeof body.purchased !== 'boolean') {
      return NextResponse.json({ error: 'Invalid purchased value' }, { status: 400 });
    }

<<<<<<< Updated upstream
    const updated = await syncShoppingItemPurchaseToPantry(prisma, id, body.purchased);
    revalidatePath('/view-pantry');
    revalidatePath('/shopping-list');
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Internal server error';
    let status = 500;
    if (message.includes('not found')) status = 404;
    if (message.includes('locked')) status = 400;
    return NextResponse.json({ error: message }, { status });
=======
    const updatedItem = await prisma.shoppingListItem.update({
      where: { id },
      data: {
        purchased: body.purchased,
        purchasedAt: body.purchased ? new Date() : null,
      },
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    console.error('Error updating purchased state:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
>>>>>>> Stashed changes
  }
}
