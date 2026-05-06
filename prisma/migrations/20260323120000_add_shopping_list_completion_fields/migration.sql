-- Add completion state to shopping lists
ALTER TABLE "ShoppingList"
ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "completedAt" TIMESTAMP(3);

-- Track purchased state per shopping list item
ALTER TABLE "ShoppingListItem"
ADD COLUMN "purchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "purchasedAt" TIMESTAMP(3);
