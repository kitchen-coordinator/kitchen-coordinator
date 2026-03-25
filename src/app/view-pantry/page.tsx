// src/app/producelist/page.tsx
import { getServerSession } from 'next-auth';
import { Container } from 'react-bootstrap';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { loggedInProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';
import PantryClient from '@/components/produce/PantryClient';

type SessionUser = { id: string; email: string; randomKey: string };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ViewPantryPage = async () => {
  noStore();
  // @ts-ignore
  const session = (await getServerSession(authOptions)) as { user: SessionUser } | null;
  loggedInProtectedPage(session);

  const owner = session?.user?.email || '';

  const produce = await prisma.produce.findMany({
    where: { owner },
    include: {
      location: { select: { id: true, name: true } },
      storage: { select: { id: true, name: true } },
    },
    orderBy: [{ name: 'asc' }],
  });

  const locations = await prisma.location.findMany({
    where: { owner },
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  const shoppingLists = await prisma.shoppingList.findMany({
    where: { owner },
    select: { id: true, name: true, isCompleted: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main>
      <Container id="view-pantry" className="py-3">
        <PantryClient
          initialProduce={produce}
          initialLocations={locations.map((loc) => loc.name)}
          initialShoppingLists={shoppingLists}
          owner={owner}
        />
      </Container>
    </main>
  );
};

export default ViewPantryPage;
