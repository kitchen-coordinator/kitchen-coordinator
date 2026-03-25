import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (typeof body.name === 'string') {
      const updated = await prisma.shoppingList.update({
        where: { id },
        data: { name: body.name.trim() },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating shopping list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
