import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const item = await prisma.shoppingListItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Ensure pantry location exists for this user
    const location = await prisma.location.upsert({
      where: { name_owner: { name: 'Default Pantry', owner: item.shoppingListId.toString() } },
      update: {},
      create: { name: 'Default Pantry', owner: item.shoppingListId.toString() },
    });

    // Ensure storage exists under that location
    const storage = await prisma.storage.upsert({
      where: { name_locationId: { name: 'Default Shelf', locationId: location.id } },
      update: {},
      create: { name: 'Default Shelf', locationId: location.id },
    });

    // Move item to pantry
    await prisma.produce.create({
      data: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || '',
        type: 'Other',
        owner: item.shoppingListId.toString(),
        locationId: location.id,
        storageId: storage.id,
      },
    });

    // Delete from shopping list
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
