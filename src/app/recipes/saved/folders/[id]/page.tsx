import Link from 'next/link';
import { Container, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

type PageProps = { params: { id: string } };
export const dynamic = 'force-dynamic';

export default async function SavedRecipesFolderPage({ params }: PageProps) {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;
  if (!email) redirect('/auth/signin');

  const folderId = Number(params.id);
  if (Number.isNaN(folderId)) return notFound();

  const folder = await prisma.savedRecipeFolder.findFirst({
    where: { id: folderId, owner: email },
    select: { id: true, name: true },
  });
  if (!folder) return notFound();

  const saved = await prisma.savedRecipe.findMany({
    where: { owner: email, folderId: folder.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      recipe: {
        select: {
          id: true,
          title: true,
          cuisine: true,
          dietary: true,
          imageUrl: true,
          description: true,
        },
      },
    },
  });

  return (
    <main style={{ backgroundColor: '#f8f9fa' }}>
      <Container className="py-5">
        <div className="mb-4">
          <Link href="/recipes/saved" passHref legacyBehavior>
            <Button
              variant="link"
              className="text-decoration-none p-0 mb-3"
              style={{ color: '#6c757d', fontSize: '0.95rem' }}
            >
              ← Back to Saved recipes
            </Button>
          </Link>

          <h1 className="display-6 fw-bold mb-2" style={{ color: '#2c3e50' }}>
            {folder.name}
          </h1>
          <div className="text-muted">
            Browse recipes saved in this folder.
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="text-muted">No recipes in this folder yet.</div>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {saved.map((s) => (
              <Col key={s.id}>
                <Link href={`/recipes/${s.recipe.id}`} className="text-decoration-none">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Img
                      variant="top"
                      src={s.recipe.imageUrl || 'https://placehold.co/800x450?text=Recipe'}
                      style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                    />
                    <Card.Body>
                      <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>
                        {s.recipe.title}
                      </Card.Title>
                      <div className="mb-2">
                        <Badge bg="secondary" pill className="me-2 mb-2">
                          {s.recipe.cuisine}
                        </Badge>
                        {(s.recipe.dietary ?? []).map((tag) => (
                          <Badge key={tag} bg="secondary" pill className="me-2 mb-2">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {s.recipe.description && (
                        <div className="text-muted small">
                          {s.recipe.description}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </main>
  );
}
