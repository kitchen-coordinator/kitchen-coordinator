import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return NextResponse.json(
      { message: 'Missing token or new password.' },
      { status: 400 },
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { message: 'Invalid or expired token.' },
      { status: 400 },
    );
  }

  // Check if new password is same as old
  const isSamePassword = await compare(newPassword, resetToken.user.password);
  if (isSamePassword) {
    return NextResponse.json(
      { message: 'New password must be different from the old password.' },
      { status: 400 },
    );
  }

  // Check length
  if (newPassword.length < 6 || newPassword.length > 40) {
    return NextResponse.json(
      { message: 'Password must be between 6 and 40 characters.' },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  return NextResponse.json(
    { message: 'Password has been reset successfully.' },
    { status: 200 },
  );
}
