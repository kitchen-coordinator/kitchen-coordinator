import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

type SessionLike = { user?: { email?: string | null } | null } | null;

function requireEmail(session: SessionLike) {
  const email = session?.user?.email ?? null;
  if (!email) {
    return { ok: false as const, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  return { ok: true as const, email };
}

export async function GET(request: Request) {
  const auth = requireEmail(await getServerSession());
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const folderIdParam = url.searchParams.get('folderId');
  const folderId = folderIdParam ? Number(folderIdParam) : null;

  if (folderIdParam && Number.isNaN(folderId)) {
    return NextResponse.json({ error: 'Invalid folderId' }, { status: 400 });
  }

  const saved = await prisma.savedRecipe.findMany({
    where: {
      owner: auth.email,
      ...(folderIdParam ? { folderId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      folderId: true,
      createdAt: true,
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          cuisine: true,
          dietary: true,
        },
      },
    },
  });

  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const auth = requireEmail(await getServerSession());
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const recipeId = Number((body as any)?.recipeId);
  const folderIdRaw = (body as any)?.folderId;
  const folderId = folderIdRaw == null || folderIdRaw === '' ? null : Number(folderIdRaw);

  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipeId' }, { status: 400 });
  }
  if (folderId !== null && Number.isNaN(folderId)) {
    return NextResponse.json({ error: 'Invalid folderId' }, { status: 400 });
  }

  // Validate recipe exists
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  // Validate folder belongs to user (if set)
  if (folderId !== null) {
    const folder = await prisma.savedRecipeFolder.findFirst({
      where: { id: folderId, owner: auth.email },
      select: { id: true },
    });
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  const saved = await prisma.savedRecipe.upsert({
    where: { owner_recipeId: { owner: auth.email, recipeId } },
    update: { folderId },
    create: { owner: auth.email, recipeId, folderId },
    select: { id: true, folderId: true, createdAt: true },
  });

  return NextResponse.json({ saved }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = requireEmail(await getServerSession());
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const recipeIdParam = url.searchParams.get('recipeId');
  const recipeId = recipeIdParam ? Number(recipeIdParam) : NaN;

  if (!recipeIdParam || Number.isNaN(recipeId)) {
    return NextResponse.json({ error: 'recipeId required' }, { status: 400 });
  }

  await prisma.savedRecipe.deleteMany({
    where: { owner: auth.email, recipeId },
  });

  return NextResponse.json({ ok: true });
}
