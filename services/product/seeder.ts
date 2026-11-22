import { db } from './src/prisma/db.js';

// ------------------------------------------------------------
// Seed data
// ------------------------------------------------------------
// This file contains the sample catalog data used during development.
// Edit these arrays to add, remove, or change sample categories
// and products. The seed script does not delete database records.
// ------------------------------------------------------------

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Everyday electronic devices and accessories.',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Useful products for home and kitchen.',
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books for learning, work, and leisure.',
  },
  {
    name: 'Fitness',
    slug: 'fitness',
    description: 'Equipment and accessories for fitness activities.',
  },
];

const products = [
  // Electronics
  {
    name: 'Wireless Headphones',
    description: 'Over-ear wireless headphones with comfortable padding.',
    // Keep prices as strings because Prisma 8 Decimal inputs expect strings.
    price: '2499.00',
    categorySlug: 'electronics',
    imageUrl: null,
    stock: 25,
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable speaker for music at home or outdoors.',
    price: '1799.00',
    categorySlug: 'electronics',
    imageUrl: null,
    stock: 18,
  },
  {
    name: 'USB-C Charger',
    description: 'Compact USB-C charger for compatible devices.',
    price: '799.00',
    categorySlug: 'electronics',
    imageUrl: null,
    stock: 40,
  },

  // Home & Kitchen
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Reusable water bottle for daily use.',
    price: '599.00',
    categorySlug: 'home-kitchen',
    imageUrl: null,
    stock: 30,
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'Simple ceramic mug for coffee, tea, or other drinks.',
    price: '299.00',
    categorySlug: 'home-kitchen',
    imageUrl: null,
    stock: 50,
  },
  {
    name: 'Storage Container Set',
    description: 'Reusable containers for organizing kitchen essentials.',
    price: '899.00',
    categorySlug: 'home-kitchen',
    imageUrl: null,
    stock: 20,
  },

  // Books
  {
    name: 'Clean Code',
    description: 'A practical book about writing maintainable software.',
    price: '699.00',
    categorySlug: 'books',
    imageUrl: null,
    stock: 12,
  },
  {
    name: 'The Pragmatic Programmer',
    description: 'Guidance on software development practices and problem solving.',
    price: '799.00',
    categorySlug: 'books',
    imageUrl: null,
    stock: 15,
  },
  {
    name: 'Atomic Habits',
    description: 'A book about building habits and improving routines.',
    price: '499.00',
    categorySlug: 'books',
    imageUrl: null,
    stock: 22,
  },

  // Fitness
  {
    name: 'Yoga Mat',
    description: 'Non-slip mat for yoga and floor workouts.',
    price: '999.00',
    categorySlug: 'fitness',
    imageUrl: null,
    stock: 16,
  },
  {
    name: 'Resistance Bands Set',
    description: 'Resistance bands for strength and mobility exercises.',
    price: '499.00',
    categorySlug: 'fitness',
    imageUrl: null,
    stock: 35,
  },
  {
    name: 'Skipping Rope',
    description: 'Adjustable skipping rope for cardio workouts.',
    price: '249.00',
    categorySlug: 'fitness',
    imageUrl: null,
    stock: 28,
  },
];

// ------------------------------------------------------------
// Main seeding function
// ------------------------------------------------------------
// Keep the logic straightforward:
// 1. Make sure each category exists.
// 2. Make sure each product exists under its category.
// 3. Print a small summary.
// ------------------------------------------------------------
async function main() {
  let categoriesCreated = 0;
  let productsCreated = 0;
  let productsSkipped = 0;

  // Create missing categories first, so products can reference them.
  for (const categoryData of categories) {
    const existingCategory = await db.orm.public.Category.whereUnique({
      slug: categoryData.slug,
    }).first();

    // A category with this slug already exists; leave it untouched.
    if (existingCategory) {
      continue;
    }

    await db.orm.public.Category.create(categoryData);
    categoriesCreated++;
  }

  // Create products only after categories have been seeded.
  for (const productData of products) {
    const category = await db.orm.public.Category.whereUnique({
      slug: productData.categorySlug,
    }).first();

    // This should only happen if a product references a slug that
    // was not included in the categories array above.
    if (!category) {
      throw new Error(`Category not found: ${productData.categorySlug}`);
    }

    // The schema does not enforce unique product names. For this seed,
    // use the product name + category as a practical duplicate check.
    const existingProduct = await db.orm.public.Product.where({
      name: productData.name,
      categoryId: category.id,
    }).first();

    // Do not create a duplicate product if it already exists.
    if (existingProduct) {
      productsSkipped++;
      continue;
    }

    // Remove the seed-only categorySlug property and use the category ID
    // required by the Product model's foreign key.
    await db.orm.public.Product.create({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      categoryId: category.id,
      imageUrl: productData.imageUrl,
      stock: productData.stock,
    });

    productsCreated++;
  }

  // Report what happened so developers can verify the seed run.
  console.log('Seed completed successfully.');
  console.log(`Categories created: ${categoriesCreated}`);
  console.log(`Products created: ${productsCreated}`);
  console.log(`Products skipped (already existed): ${productsSkipped}`);
}

// ------------------------------------------------------------
// Run the script and always close the database connection.
// If seeding fails, log the error and exit with a failure status.
// ------------------------------------------------------------
main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
