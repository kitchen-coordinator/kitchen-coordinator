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

export async function GET() {
  const auth = requireEmail(await getServerSession());
  if (!auth.ok) return auth.res;

  const folders = await prisma.savedRecipeFolder.findMany({
    where: { owner: auth.email },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ folders });
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

  const name = typeof (body as any)?.name === 'string' ? (body as any).name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Folder name required' }, { status: 400 });

  try {
    const folder = await prisma.savedRecipeFolder.create({
      data: { owner: auth.email, name },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (e: any) {
    // Prisma unique constraint violation
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A folder with that name already exists.' }, { status: 409 });
    }
    console.error('Error creating saved recipe folder:', e);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
