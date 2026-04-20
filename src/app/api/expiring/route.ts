import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerEmail = searchParams.get('owner');
  if (!ownerEmail) return NextResponse.json({ error: 'Owner email required' }, { status: 400 });
  const now = new Date();

  // TODO: Expiring within 1 day.

  // TODO: Expiring within 1 week.

  // TODO: Expired items.

  // TODO: Remove old logic
  const soon = new Date();
  soon.setDate(now.getDate() + 1);

  const expiringItems = await prisma.produce.findMany({
    where: { owner: ownerEmail, expiration: { lte: soon } },
  });
  // End old logic

  return NextResponse.json({ expiringItems });
}
