// src/types/ProduceRelations.ts

import { Prisma } from '@prisma/client';

export type ProduceRelations = Prisma.ProduceGetPayload<{
  include: {
    location: true;
    storage: true;
    commonItem: true;
  };
}>;
