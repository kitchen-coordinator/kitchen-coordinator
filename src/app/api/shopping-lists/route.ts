import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerEmail = searchParams.get('owner');
  if (!ownerEmail) return NextResponse.json({ error: 'Owner email required' }, { status: 400 });

  const shoppingLists = await prisma.shoppingList.findMany({
    where: { owner: ownerEmail },
    include: {
      items: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({ shoppingLists });
}
