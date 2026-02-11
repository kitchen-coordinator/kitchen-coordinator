import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ isAllowed: false }, { status: 400 });
    }

    const bypassEmailsStr = process.env.BYPASS_EMAILS?.toString().trim() || '';

    if (!bypassEmailsStr) {
      return NextResponse.json({ isAllowed: false });
    }

    // Split by comma and trim each email, then check for exact match
    const bypassEmails = bypassEmailsStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const trimmedEmail = email.trim();
    const isAllowed = bypassEmails.includes(trimmedEmail);

    // If email is in bypass list, mark user as verified
    if (isAllowed) {
      try {
        await prisma.user.update({
          where: { email: trimmedEmail },
          data: { emailVerified: true },
        });
      } catch (updateError) {
        // User might not exist yet, that's okay - they'll be verified when they register
        console.log('Could not update user verification status:', updateError);
      }
    }

    return NextResponse.json({ isAllowed });
  } catch (error) {
    console.error('Error checking bypass email:', error);
    return NextResponse.json({ isAllowed: false }, { status: 500 });
  }
}
