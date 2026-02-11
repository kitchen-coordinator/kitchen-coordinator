import { getServerSession } from 'next-auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';
import { getRecipes } from '@/lib/recipes';
import { getUserProduceByEmail } from '@/lib/dbActions';
import DashboardMenu from '../../components/dashboard/DashboardMenu';

export const dynamic = 'force-dynamic';

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(session);

  const email = session?.user?.email;
  if (!email) {
    throw new Error('Authenticated session is missing user email.');
  }
  const [recipes, produce] = await Promise.all([
    getRecipes(),
    getUserProduceByEmail(email),
  ]);

  return (
    <main>
      <DashboardMenu ownerEmail={email} recipes={recipes} produce={produce} />
    </main>
  );
};

export default DashboardPage;
