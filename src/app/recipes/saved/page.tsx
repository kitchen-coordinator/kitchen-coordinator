/* eslint-disable no-underscore-dangle */

import Link from 'next/link';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CreateSavedFolderButton from '@/components/recipes/CreateSavedFolderButton';

export const dynamic = 'force-dynamic';

export default async function SavedRecipesHomePage() {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;
  if (!email) redirect('/auth/signin');

  const [folders, unsortedCount] = await Promise.all([
    prisma.savedRecipeFolder.findMany({
      where: { owner: email },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { savedRecipes: true } },
      },
    }),
    prisma.savedRecipe.count({
      where: { owner: email, folderId: null },
    }),
  ]);

  return (
    <main style={{ backgroundColor: '#f8f9fa' }}>
      <Container className="py-5">
        <div className="mb-4">
          <Link href="/recipes" passHref legacyBehavior>
            <Button
              variant="link"
              className="text-decoration-none p-0 mb-3"
              style={{ color: '#6c757d', fontSize: '0.95rem' }}
            >
              ← Back to Recipes
            </Button>
          </Link>

          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h1 className="display-6 fw-bold mb-2" style={{ color: '#2c3e50' }}>
                Saved recipes
              </h1>
              <div className="text-muted">
                Choose a folder to browse, or view your unsorted saves.
              </div>
            </div>

            <div className="d-flex gap-2">
              <CreateSavedFolderButton />
            </div>
          </div>
        </div>

        <Row xs={1} md={2} lg={3} className="g-4">
          <Col>
            <Link href="/recipes/saved/unsorted" className="text-decoration-none">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>
                    Unsorted
                  </Card.Title>
                  <div className="text-muted small mb-3">
                    Saved recipes not in a folder.
                  </div>
                  <Badge bg="light" text="dark" style={{ border: '1px solid #dee2e6' }}>
                    {unsortedCount}
                    {' '}
                    recipe
                    {unsortedCount === 1 ? '' : 's'}
                  </Badge>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {folders.map((f) => (
            <Col key={f.id}>
              <Link href={`/recipes/saved/folders/${f.id}`} className="text-decoration-none">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>
                      {f.name}
                    </Card.Title>
                    <Badge bg="light" text="dark" style={{ border: '1px solid #dee2e6' }}>
                      {f._count.savedRecipes}
                      {' '}
                      recipe
                      {f._count.savedRecipes === 1 ? '' : 's'}
                    </Badge>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </main>
  );
}
