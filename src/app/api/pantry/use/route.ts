import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { checkAndAddToShoppingList } from '@/lib/restock';

type UseItem = { name: string; deductAmount: number };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: UseItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 });
  }

  const updated = [];

  for (const item of items) {
    const produce = await prisma.produce.findUnique({
      where: { name_owner: { name: item.name, owner: email } },
    });

    if (!produce) continue;

    const newQty = Math.max(0, produce.quantity - item.deductAmount);

    const result = await prisma.produce.update({
      where: { id: produce.id },
      data: { quantity: newQty },
    });

    await checkAndAddToShoppingList(produce.id, email);

    updated.push({ name: result.name, newQuantity: result.quantity });
  }

  return NextResponse.json({ updated });
}
