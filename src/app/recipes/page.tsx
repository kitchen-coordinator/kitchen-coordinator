import { Container } from 'react-bootstrap';
import { getServerSession } from 'next-auth';

import RecipesClient from '@/components/recipes/RecipesClient';
import authOptions from '@/lib/authOptions';
import { getRecipes } from '@/lib/recipes';
import { getUserProduceByEmail } from '@/lib/dbActions';

export const dynamic = 'force-dynamic';

const RecipeListPage = async () => {
  const session = await getServerSession(authOptions);
  const { email, role } = session?.user ?? {};

  const [recipes, produce] = await Promise.all([
    getRecipes(),
    email ? getUserProduceByEmail(email) : Promise.resolve([]),
  ]);

  return (
    <main data-testid="recipes-page">
      <Container fluid className="py-3">
        <Container>
          <h2 className="text-center mb-4">Recipes</h2>
          <RecipesClient
            key={email ?? 'guest'}
            recipes={recipes}
            produce={produce}
            canAdd={!!email}
            currentUserEmail={email ?? null}
            isAdmin={role === 'ADMIN'}
          />
        </Container>
      </Container>
    </main>
  );
};

export default RecipeListPage;
