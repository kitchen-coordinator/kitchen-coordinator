CREATE TABLE "CommonItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "owner" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "preferredDisplayUnit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommonItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Produce" ADD COLUMN "commonItemId" INTEGER;

CREATE UNIQUE INDEX "CommonItem_name_owner_key" ON "CommonItem"("name", "owner");

ALTER TABLE "Produce"
ADD CONSTRAINT "Produce_commonItemId_fkey"
FOREIGN KEY ("commonItemId") REFERENCES "CommonItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;