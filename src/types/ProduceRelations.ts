// src/types/ProduceRelations.ts
import { Produce, Location, Storage } from '@prisma/client';

export type ProduceRelations = Omit<
Produce,
'locationId' | 'storageId' | 'restockTrigger' | 'customThreshold'
> & {
  location: Location;
  storage: Storage;
  displayQuantity?: number | null;
  displayUnit?: string | null;
  displayRestockThreshold?: number | null;
};
