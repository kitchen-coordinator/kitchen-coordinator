import { addCommonItem, getCommonItemsByOwner } from '@/lib/dbActions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner')?.trim();

  if (!owner) {
    return NextResponse.json({ error: 'Missing owner' }, { status: 400 });
  }

  const items = await getCommonItemsByOwner(owner);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await addCommonItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create common item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}