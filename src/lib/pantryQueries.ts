import { prisma } from '@/lib/prisma';

export async function getUserProduceByEmail(owner: string) {
  return prisma.produce.findMany({
    where: { owner },
    select: { name: true },
  });
}

export async function getUserProduceWithQuantity(owner: string) {
  return prisma.produce.findMany({
    where: { owner },
    select: { id: true, name: true, quantity: true, unit: true },
    orderBy: { name: 'asc' },
  });
}