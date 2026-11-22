import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------
// Categories
// ---------------------------------------------

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Accessories for everyday use.',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing and fashion products.',
  },
  {
    name: 'Home',
    slug: 'home',
    description: 'Products for your home and living space.',
  },
  {
    name: 'Fitness',
    slug: 'fitness',
    description: 'Fitness and exercise products.',
  },
];

const products = [
  {
    name: 'Wireless Headphones',
    description:
      'Over-ear wireless headphones with noise isolation, rich sound, and long battery life.',
    price: 4999,
    categorySlug: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    stock: 25,
    isActive: true,
  },
  {
    name: 'Smart Watch',
    description: 'Smart watch with activity tracking, heart rate monitoring, and notifications.',
    price: 3499,
    categorySlug: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    stock: 18,
    isActive: true,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact mechanical keyboard with tactile switches and a durable build.',
    price: 2799,
    categorySlug: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212',
    stock: 12,
    isActive: true,
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with adjustable DPI and precise tracking.',
    price: 1299,
    categorySlug: 'accessories',
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db',
    stock: 30,
    isActive: true,
  },
  {
    name: 'Aluminium Laptop Stand',
    description: 'Adjustable aluminium stand designed for improved desk ergonomics.',
    price: 1499,
    categorySlug: 'accessories',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
    stock: 22,
    isActive: true,
  },
  {
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI, USB ports, and SD card connectivity.',
    price: 1899,
    categorySlug: 'accessories',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1764113096548-11270b5febed',
    stock: 15,
    isActive: true,
  },
  {
    name: 'Urban Backpack',
    description:
      'Everyday backpack with laptop compartment, multiple pockets, and water-resistant fabric.',
    price: 2199,
    categorySlug: 'fashion',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
    stock: 20,
    isActive: true,
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with cushioned soles for everyday training.',
    price: 2999,
    categorySlug: 'fashion',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    stock: 14,
    isActive: true,
  },
  {
    name: 'Classic Hoodie',
    description: 'Comfortable cotton-blend hoodie suitable for everyday casual wear.',
    price: 1799,
    categorySlug: 'fashion',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
    stock: 35,
    isActive: true,
  },
  {
    name: 'Insulated Water Bottle',
    description: 'Reusable insulated bottle designed to keep beverages cold or warm for hours.',
    price: 799,
    categorySlug: 'home',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    stock: 40,
    isActive: true,
  },
  {
    name: 'LED Desk Lamp',
    description: 'Minimal desk lamp with adjustable brightness for work and reading.',
    price: 1199,
    categorySlug: 'home',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
    stock: 16,
    isActive: true,
  },
  {
    name: 'French Press Coffee Maker',
    description: 'Simple French press coffee maker for brewing rich and aromatic coffee.',
    price: 999,
    categorySlug: 'home',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
    stock: 10,
    isActive: true,
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip exercise mat for yoga, stretching, and floor workouts.',
    price: 899,
    categorySlug: 'fitness',
    imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2',
    stock: 27,
    isActive: true,
  },
  {
    name: 'Adjustable Dumbbell Set',
    description: 'Adjustable dumbbells for strength training and home workouts.',
    price: 3999,
    categorySlug: 'fitness',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
    stock: 8,
    isActive: true,
  },
  {
    name: 'Foam Roller',
    description: 'Textured foam roller for mobility, warm-ups, and muscle recovery.',
    price: 699,
    categorySlug: 'fitness',
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e',
    stock: 19,
    isActive: true,
  },
];

// ---------------------------------------------
// Seed function
// ---------------------------------------------

async function seedCategories() {
  console.log('Seeding categories...');

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: category,
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

async function seedProducts() {
  console.log('Seeding products...');

  for (const product of products) {
    // Find the category using the product's category slug.
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });

    // Find an existing product with the same name in this category.
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name,
        categoryId: category.id,
      },
    });

    // Product fields that are shared between create and update.
    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: category.id,
      imageUrl: product.imageUrl,
      stock: product.stock,
      isActive: true,
    };

    if (existingProduct) {
      // Update the existing product instead of inserting a duplicate.
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      // Create the product if it does not already exist.
      await prisma.product.create({
        data: productData,
      });
    }
  }

  console.log(`Seeded ${products.length} products.`);
}

// ---------------------------------------------
// Main
// ---------------------------------------------

async function main() {
  console.log('Starting database seed...');

  // Categories must exist before products can reference them.
  await seedCategories();

  // Seed products after their categories are available.
  await seedProducts();

  console.log('Database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Close Prisma connection when the script finishes.
    await prisma.$disconnect();
  });
