import { Container } from 'react-bootstrap';
import RecipesClient from '@/components/recipes/RecipesClient';
import { getRecipes } from '@/lib/recipes';

import { getServerSession } from 'next-auth';
import { getUserProduceByEmail } from '@/lib/pantryQueries';

export const dynamic = 'force-dynamic';

// ...
export default async function RecipeListPage() {
  const session = await getServerSession();

  const email = session?.user?.email ?? null;
  const canAdd = !!email; // anyone logged-in can add
  const isAdmin = email === 'admin@foo.com'; // adjust if you have a real role system

  let pantry: any[] = [];
  if (email) pantry = await getUserProduceByEmail(email);

  const recipes = await getRecipes();

  return (
    <main>
      <Container id="list" fluid className="py-3">
        <Container>
          <h2 className="text-center mb-4">Recipes</h2>
          <RecipesClient
            key={email}
            recipes={recipes}
            produce={pantry}
            canAdd={canAdd}
            currentUserEmail={email}
            isAdmin={isAdmin}
          />
        </Container>
      </Container>
    </main>
  );
}
