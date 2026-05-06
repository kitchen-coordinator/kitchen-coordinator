import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(request.url);
  const recipeIdParam = url.searchParams.get('recipeId');
  const recipeId = recipeIdParam ? Number(recipeIdParam) : NaN;

  if (!recipeIdParam || Number.isNaN(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipeId' }, { status: 400 });
  }

  const saved = await prisma.savedRecipe.findUnique({
    where: { owner_recipeId: { owner: email, recipeId } },
    select: { id: true, folderId: true, createdAt: true },
  });

  return NextResponse.json({ saved });
}
