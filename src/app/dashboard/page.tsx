import { getServerSession } from 'next-auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';
import { getRecipes } from '@/lib/recipes';
import { getUserProduceByEmail } from '@/lib/pantryQueries';
import DashboardMenu from '../../components/dashboard/DashboardMenu';

export const dynamic = 'force-dynamic';

type SessionUser = { id: string; email: string; randomKey: string };

const DashboardPage = async () => {
  const session = (await getServerSession(authOptions)) as { user: SessionUser } | null;
  loggedInProtectedPage(session);

  const email = session?.user?.email || '';

  // Fetch recipes and produce server-side (same pattern as recipes/page.tsx)
  const recipes = await getRecipes();
  const pantry = email ? await getUserProduceByEmail(email) : [];

  return (
    <main>
      <DashboardMenu
        ownerEmail={email}
        recipes={recipes}
        produce={pantry}
      />
    </main>
  );
};

export default DashboardPage;
