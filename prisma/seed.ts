/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import * as config from '../config/settings.development.json';

// Use the same adapter-based client config as your app
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
  log: ['query'], // optional, like in lib/prisma.ts
});

async function main() {
  console.log('Seeding the database');
  const password = await hash('changeme', 10);

  // Seed users
  for (const account of config.defaultAccounts) {
    const role = (account.role as Role) || Role.USER;
    console.log(`  Creating user: ${account.email} with role: ${role}`);

    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        role,
        emailVerified: true,
      },
    });
  }

  // Seed produce
  for (const produce of config.defaultProduce) {
    console.log(`  Adding produce: ${JSON.stringify(produce)}`);

    // Upsert the Location (unique per owner)
    const location = await prisma.location.upsert({
      where: {
        name_owner: {
          name: produce.location,
          owner: produce.owner,
        },
      },
      update: {},
      create: {
        name: produce.location,
        owner: produce.owner,
      },
    });

    // Upsert the Storage (unique per location)
    const storage = await prisma.storage.upsert({
      where: {
        name_locationId: {
          name: produce.storage,
          locationId: location.id,
        },
      },
      update: {},
      create: {
        name: produce.storage,
        locationId: location.id,
      },
    });

    // Upsert the Produce (link via IDs)
    await prisma.produce.upsert({
      where: { name_owner: { name: produce.name, owner: produce.owner } },
      update: {},
      create: {
        name: produce.name,
        type: produce.type,
        locationId: location.id,
        storageId: storage.id,
        quantity: produce.quantity,
        unit: produce.unit,
        expiration: produce.expiration ? new Date(produce.expiration) : null,
        owner: produce.owner,
        image: produce.image ?? null,
      },
    });
  }

  // Seed shopping lists
  for (const shoppinglist of config.defaultShoppingList) {
    console.log(`  Adding shopping list: ${JSON.stringify(shoppinglist)}`);

    const createdList = await prisma.shoppingList.upsert({
      where: { name_owner: { name: shoppinglist.name, owner: shoppinglist.owner } },
      update: {},
      create: {
        name: shoppinglist.name,
        owner: shoppinglist.owner,
      },
    });

    for (const item of shoppinglist.items) {
      await prisma.shoppingListItem.upsert({
        where: {
          shoppingListId_name: {
            shoppingListId: createdList.id,
            name: item.name,
          },
        },
        update: {},
        create: {
          shoppingListId: createdList.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
        },
      });
    }
  }

  // Seed Recipe
  if ((config as any).defaultRecipes?.length) {
    type IngredientItemSeed = {
      name: string;
      quantity: number | null;
      unit: string | null;
    };

    type RecipeSeed = {
      title: string;
      cuisine: string;
      description?: string;
      imageUrl?: string;
      dietary?: string[];
      // legacy input still allowed, but only used to build ingredientItems
      ingredients?: string[];
      // new structured ingredients
      ingredientItems?: IngredientItemSeed[];
      owner: string;
      instructions?: string;
      servings?: number;
      prepMinutes?: number;
      cookMinutes?: number;
      sourceUrl?: string;
    };

    console.log('  Seeding recipes...');

    for (const r of (config as any).defaultRecipes as RecipeSeed[]) {
      console.log(`  upsert recipe: ${r.title} (${r.owner})`);

      // ---- Build ingredient items (from ingredientItems or legacy ingredients[]) ----
      let items: IngredientItemSeed[] = [];

      if (r.ingredientItems && r.ingredientItems.length > 0) {
        items = r.ingredientItems;
      } else if (r.ingredients && r.ingredients.length > 0) {
        // Fallback so older config still works
        items = r.ingredients.map((name) => ({
          name,
          quantity: null,
          unit: null,
        }));
      }

      // ---- Upsert Recipe (NO legacy ingredients field) ----
      const recipe = await prisma.recipe.upsert({
        where: { title_owner: { title: r.title, owner: r.owner } },
        update: {
          cuisine: r.cuisine,
          description: r.description ?? null,
          imageUrl: r.imageUrl && r.imageUrl.length > 0 ? r.imageUrl : null,
          dietary: r.dietary ?? [],
          instructions: r.instructions ?? null,
          servings: r.servings ?? null,
          prepMinutes: r.prepMinutes ?? null,
          cookMinutes: r.cookMinutes ?? null,
          sourceUrl: r.sourceUrl ?? null,
        },
        create: {
          title: r.title,
          cuisine: r.cuisine,
          description: r.description ?? null,
          imageUrl: r.imageUrl && r.imageUrl.length > 0 ? r.imageUrl : null,
          dietary: r.dietary ?? [],
          owner: r.owner,
          instructions: r.instructions ?? null,
          servings: r.servings ?? null,
          prepMinutes: r.prepMinutes ?? null,
          cookMinutes: r.cookMinutes ?? null,
          sourceUrl: r.sourceUrl ?? null,
        },
      });

      // ---- Handle ingredient rows (recipeIngredient / ingredientItems) ----
      if (items.length > 0) {
        await prisma.recipeIngredient.deleteMany({
          where: { recipeId: recipe.id },
        });

        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];

          await prisma.recipeIngredient.create({
            data: {
              recipeId: recipe.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              order: index,
            },
          });
        }
      }
      // If items.length === 0 → do nothing (no ingredient deletion)
    }
  }

  console.log('Seeding complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
