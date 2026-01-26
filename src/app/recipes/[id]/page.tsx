import Link from 'next/link';
import { Container, Row, Col, Image, Badge, Button } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';
import { notFound } from 'next/navigation';
import { getRecipeById } from '@/lib/recipes';
import { getServerSession } from 'next-auth';
import { getUserProduceByEmail } from '@/lib/dbActions';
import AddToShoppingList from '@/components/recipes/AddToShoppingList';
import UploadDishButton from '@/components/recipes/UploadDishButton';
import ViewDishImagesButton from '@/components/recipes/ViewDishImagesButton';

type PageProps = { params: { id: string } };
export const dynamic = 'force-dynamic';

export default async function RecipeDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return notFound();

  const recipe = await getRecipeById(id);
  if (!recipe) return notFound();

  const session = await getServerSession();
  const email = session?.user?.email ?? null;

  let pantry: any[] = [];
  if (email) {
    pantry = await getUserProduceByEmail(email);
  }

  // Create a set of pantry item names (lowercase for case-insensitive matching)
  const pantryNames = new Set(pantry.map((p) => p.name.toLowerCase()));

  const displayOwner = recipe.owner?.includes('admin@foo.com') ? ['Kitchen Coordinator Team'] : recipe.owner;

  // Only use ingredientItems from the relation
  const ingredientItems = recipe.ingredientItems ?? [];

  // Missing item names (for AddToShoppingList)
  const missingItems = ingredientItems.filter((item) => !pantryNames.has(item.name.toLowerCase()));

  return (
    <main style={{ backgroundColor: '#f8f9fa' }}>
      <Container className="py-5">
        {/* Header Section */}
        <div className="mb-4">
          <Link href="/recipes" passHref>
            <Button
              variant="link"
              className="text-decoration-none p-0 mb-3"
              style={{ color: '#6c757d', fontSize: '0.95rem' }}
            >
              ← Back to Recipes
            </Button>
          </Link>

          <h1 className="display-5 fw-bold mb-3" style={{ color: '#2c3e50' }}>
            {recipe.title}
          </h1>

          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            {recipe.owner && (
              <div className="d-flex align-items-center">
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: '#6c757d',
                    fontWeight: 500,
                  }}
                >
                  {'By '}
                  {displayOwner}
                </span>
              </div>
            )}

            {recipe.cuisine && (
              <Badge
                bg="light"
                text="dark"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  padding: '0.4rem 0.8rem',
                  border: '1px solid #dee2e6',
                }}
              >
                {recipe.cuisine}
              </Badge>
            )}
          </div>

          {recipe.dietary?.length ? (
            <div className="d-flex flex-wrap gap-2">
              {recipe.dietary.map((d) => (
                <Badge
                  bg="success"
                  key={d}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    padding: '0.4rem 0.75rem',
                  }}
                >
                  {d}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <Row className="g-4">
          {/* Image Section */}
          <Col lg={5}>
            <div className="card border-0 shadow-sm" style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
                <Image
                  src={recipe.imageUrl || 'https://placehold.co/800x600?text=Recipe'}
                  alt={recipe.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Quick Info Card */}
            {(recipe.servings || recipe.prepMinutes || recipe.cookMinutes) && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h6
                    className="text-uppercase fw-bold mb-3"
                    style={{
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px',
                      color: '#495057',
                    }}
                  >
                    Recipe Info
                  </h6>
                  <Row className="g-3">
                    {recipe.servings && (
                      <Col xs={4}>
                        <div className="text-center">
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              color: '#28a745',
                            }}
                          >
                            {recipe.servings}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#6c757d',
                              marginTop: '0.25rem',
                            }}
                          >
                            Servings
                          </div>
                        </div>
                      </Col>
                    )}
                    {recipe.prepMinutes && (
                      <Col xs={4}>
                        <div className="text-center">
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              color: '#17a2b8',
                            }}
                          >
                            {recipe.prepMinutes}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#6c757d',
                              marginTop: '0.25rem',
                            }}
                          >
                            Prep (min)
                          </div>
                        </div>
                      </Col>
                    )}
                    {recipe.cookMinutes && (
                      <Col xs={4}>
                        <div className="text-center">
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              color: '#fd7e14',
                            }}
                          >
                            {recipe.cookMinutes}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#6c757d',
                              marginTop: '0.25rem',
                            }}
                          >
                            Cook (min)
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            )}

            {recipe.sourceUrl && (
              <Button
                as="a"
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline-success"
                className="w-100 mt-3"
                style={{ fontWeight: 500 }}
              >
                View Original Recipe →
              </Button>
            )}

            <div className="mt-3">
              <UploadDishButton recipeId={recipe.id} recipeTitle={recipe.title} userEmail={email} />
            </div>

            <div className="mt-3">
              <ViewDishImagesButton recipeId={recipe.id} recipeTitle={recipe.title} />
            </div>
          </Col>

          {/* Content Section */}
          <Col lg={7}>
            {recipe.description && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <p
                    className="mb-0"
                    style={{
                      fontSize: '1.05rem',
                      lineHeight: '1.7',
                      color: '#495057',
                    }}
                  >
                    {recipe.description}
                  </p>
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="mb-3 fw-bold" style={{ color: '#2c3e50' }}>
                  Ingredients
                </h5>

                <ul
                  style={{
                    paddingLeft: '1.25rem',
                    lineHeight: '2',
                    color: '#495057',
                  }}
                >
                  {ingredientItems.map((item) => {
                    const hasItem = pantryNames.has(item.name.toLowerCase());

                    const parts: string[] = [];
                    if (item.quantity != null) {
                      parts.push(Number.isInteger(item.quantity) ? String(item.quantity) : String(item.quantity));
                    }
                    if (item.unit) {
                      parts.push(item.unit);
                    }
                    parts.push(item.name);

                    const label = parts.join(' ');

                    return (
                      <li key={item.id ?? `${item.name}-${item.unit ?? ''}`} style={{ marginBottom: '0.5rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <span>{label}</span>
                          {hasItem ? (
                            <CheckCircleFill color="#28a745" size={16} title="You have this in your pantry" />
                          ) : (
                            <XCircleFill color="#dc3545" size={16} title="You don't have this in your pantry" />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Add-to-shopping-list controls (client) */}
                <AddToShoppingList missingItems={missingItems} />
              </div>
            </div>

            {/* Instructions */}
            {recipe.instructions?.trim() && (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3 fw-bold" style={{ color: '#2c3e50' }}>
                    Instructions
                  </h5>
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      lineHeight: '1.8',
                      color: '#495057',
                      fontSize: '1rem',
                    }}
                  >
                    {recipe.instructions}
                  </div>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </main>
  );
}
