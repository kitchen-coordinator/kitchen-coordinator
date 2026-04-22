import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/*
  NOTE: Use this API Route to grab items that have or will expire within the week.
  In the frontend, filter further to separate items that expire today, tomorrow, or keep it within the week.
*/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerEmail = searchParams.get('owner');
  if (!ownerEmail) return NextResponse.json({ error: 'Owner email required' }, { status: 400 });

  // Relevant Dates
  const today = new Date();

  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  // Fetch Items
  const expireItems = await prisma.produce.findMany({
    where: {
      owner: ownerEmail,
      expiration: { not: null, lte: nextWeek },
    },
    orderBy: { expiration: 'asc' },
    include: { location: true, storage: true },
  });

  // Filter: < Today
  const expiredItems = expireItems.filter(
    (item) => item.expiration && item.expiration < today,
  );

  // Filter: Today -> Next Week
  const expiringWithinWeek = expireItems.filter(
    (item) => item.expiration && item.expiration >= today && item.expiration <= nextWeek,
  );

  return NextResponse.json({ expiredItems, expiringWithinWeek });
}
