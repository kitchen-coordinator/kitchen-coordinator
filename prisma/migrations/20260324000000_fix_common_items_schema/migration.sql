DROP INDEX IF EXISTS "CommonItem_name_owner_key";

ALTER TABLE "CommonItem"
RENAME COLUMN "preferredDisplayUnit" TO "displayUnit";

ALTER TABLE "CommonItem"
RENAME COLUMN "baseUnit" TO "normalizedUnit";

ALTER TABLE "CommonItem"
ADD COLUMN "normalizedQuantityPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "CommonItem"
DROP COLUMN IF EXISTS "type",
DROP COLUMN IF EXISTS "defaultUnit";

CREATE UNIQUE INDEX "CommonItem_name_owner_displayUnit_key"
ON "CommonItem"("name", "owner", "displayUnit");