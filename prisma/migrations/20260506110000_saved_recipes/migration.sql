-- CreateTable
CREATE TABLE "SavedRecipeFolder" (
    "id" SERIAL NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRecipeFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRecipe" (
    "id" SERIAL NOT NULL,
    "owner" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "folderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedRecipeFolder_owner_name_key" ON "SavedRecipeFolder"("owner", "name");

-- CreateIndex
CREATE INDEX "SavedRecipeFolder_owner_idx" ON "SavedRecipeFolder"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "SavedRecipe_owner_recipeId_key" ON "SavedRecipe"("owner", "recipeId");

-- CreateIndex
CREATE INDEX "SavedRecipe_owner_folderId_idx" ON "SavedRecipe"("owner", "folderId");

-- CreateIndex
CREATE INDEX "SavedRecipe_recipeId_idx" ON "SavedRecipe"("recipeId");

-- AddForeignKey
ALTER TABLE "SavedRecipe" ADD CONSTRAINT "SavedRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipe" ADD CONSTRAINT "SavedRecipe_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SavedRecipeFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

