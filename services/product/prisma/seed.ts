import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    id: 'prod-wireless-headphones',
    name: 'Wireless Headphones',
    description:
      'Over-ear wireless headphones with noise isolation, rich sound, and long battery life.',
    price: 4999,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    stock: 25,
    isActive: true,
  },
  {
    id: 'prod-smart-watch',
    name: 'Smart Watch',
    description: 'Smart watch with activity tracking, heart rate monitoring, and notifications.',
    price: 3499,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    stock: 18,
    isActive: true,
  },
  {
    id: 'prod-mechanical-keyboard',
    name: 'Mechanical Keyboard',
    description: 'Compact mechanical keyboard with tactile switches and a durable build.',
    price: 2799,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212',
    stock: 12,
    isActive: true,
  },
  {
    id: 'prod-wireless-mouse',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with adjustable DPI and precise tracking.',
    price: 1299,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db',
    stock: 30,
    isActive: true,
  },
  {
    id: 'prod-laptop-stand',
    name: 'Aluminium Laptop Stand',
    description: 'Adjustable aluminium stand designed for improved desk ergonomics.',
    price: 1499,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
    stock: 22,
    isActive: true,
  },
  {
    id: 'prod-usb-c-hub',
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI, USB ports, and SD card connectivity.',
    price: 1899,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1625723044792-8f5a8e7e4a1f',
    stock: 15,
    isActive: true,
  },
  {
    id: 'prod-backpack',
    name: 'Urban Backpack',
    description:
      'Everyday backpack with laptop compartment, multiple pockets, and water-resistant fabric.',
    price: 2199,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
    stock: 20,
    isActive: true,
  },
  {
    id: 'prod-running-shoes',
    name: 'Running Shoes',
    description: 'Lightweight running shoes with cushioned soles for everyday training.',
    price: 2999,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    stock: 14,
    isActive: true,
  },
  {
    id: 'prod-hoodie',
    name: 'Classic Hoodie',
    description: 'Comfortable cotton-blend hoodie suitable for everyday casual wear.',
    price: 1799,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
    stock: 35,
    isActive: true,
  },
  {
    id: 'prod-water-bottle',
    name: 'Insulated Water Bottle',
    description: 'Reusable insulated bottle designed to keep beverages cold or warm for hours.',
    price: 799,
    category: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    stock: 40,
    isActive: true,
  },
  {
    id: 'prod-desk-lamp',
    name: 'LED Desk Lamp',
    description: 'Minimal desk lamp with adjustable brightness for work and reading.',
    price: 1199,
    category: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
    stock: 16,
    isActive: true,
  },
  {
    id: 'prod-coffee-maker',
    name: 'French Press Coffee Maker',
    description: 'Simple French press coffee maker for brewing rich and aromatic coffee.',
    price: 999,
    category: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
    stock: 10,
    isActive: true,
  },
  {
    id: 'prod-yoga-mat',
    name: 'Yoga Mat',
    description: 'Non-slip exercise mat for yoga, stretching, and floor workouts.',
    price: 899,
    category: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2',
    stock: 27,
    isActive: true,
  },
  {
    id: 'prod-dumbbell-set',
    name: 'Adjustable Dumbbell Set',
    description: 'Adjustable dumbbells for strength training and home workouts.',
    price: 3999,
    category: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
    stock: 8,
    isActive: true,
  },
  {
    id: 'prod-foam-roller',
    name: 'Foam Roller',
    description: 'Textured foam roller for mobility, warm-ups, and muscle recovery.',
    price: 699,
    category: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e',
    stock: 19,
    isActive: true,
  },
] as const;

async function main(): Promise<void> {
  console.log('Starting product seed...');

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log(`Successfully seeded ${products.length} products.`);
}

main()
  .catch((error: unknown) => {
    console.error('Product seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
