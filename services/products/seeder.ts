import { db } from './src/prisma/db';

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic gadgets, accessories, and everyday technology.',
    products: [
      {
        name: 'Wireless Bluetooth Headphones',
        description:
          'Comfortable wireless headphones with rich sound, deep bass, and long battery life.',
        price: '2499.00',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      },
      {
        name: 'Smart Watch',
        description: 'Smart watch with fitness tracking, notifications, and a modern design.',
        price: '3499.00',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      },
      {
        name: 'Portable Bluetooth Speaker',
        description: 'Compact portable speaker with powerful audio and a rechargeable battery.',
        price: '1799.00',
        imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1',
      },
      {
        name: 'Wireless Gaming Mouse',
        description: 'Ergonomic wireless mouse with precise tracking for gaming and productivity.',
        price: '1299.00',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Mechanical keyboard with tactile keys and a durable build for everyday use.',
        price: '2999.00',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      },
    ],
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, footwear, and fashion essentials.',
    products: [
      {
        name: 'Classic Cotton T-Shirt',
        description: 'Soft cotton crew-neck t-shirt suitable for everyday wear.',
        price: '599.00',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      },
      {
        name: 'Casual Denim Jeans',
        description: 'Classic denim jeans with a comfortable fit and timeless style.',
        price: '1499.00',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
      },
      {
        name: 'Minimalist Sneakers',
        description: 'Versatile sneakers designed for comfort and casual outfits.',
        price: '2199.00',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      },
      {
        name: 'Leather Wallet',
        description: 'Slim wallet with multiple card slots and a compact design.',
        price: '899.00',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93',
      },
      {
        name: 'Classic Sunglasses',
        description: 'Lightweight sunglasses with a versatile frame design.',
        price: '999.00',
        imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083',
      },
    ],
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Useful products and accessories for a comfortable home.',
    products: [
      {
        name: 'Ceramic Coffee Mug',
        description: 'Minimal ceramic mug for coffee, tea, and everyday beverages.',
        price: '399.00',
        imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
      },
      {
        name: 'Decorative Table Lamp',
        description: 'Modern table lamp providing warm lighting for bedrooms and living spaces.',
        price: '1599.00',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
      },
      {
        name: 'Throw Pillow',
        description: 'Soft decorative cushion designed to add comfort to sofas and beds.',
        price: '699.00',
        imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2',
      },
      {
        name: 'Indoor Plant Pot',
        description: 'Stylish planter for indoor plants and home decoration.',
        price: '499.00',
        imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
      },
      {
        name: 'Wooden Wall Clock',
        description: 'Simple wall clock with a clean design for modern interiors.',
        price: '1199.00',
        imageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade',
      },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Personal care and grooming products for daily routines.',
    products: [
      {
        name: 'Face Moisturizer',
        description: 'Daily moisturizer designed to keep skin hydrated and soft.',
        price: '499.00',
        imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
      },
      {
        name: 'Perfume',
        description: 'A versatile fragrance suitable for everyday use and special occasions.',
        price: '1799.00',
        imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601',
      },
      {
        name: 'Hair Care Shampoo',
        description: 'Daily shampoo for cleansing hair and maintaining a fresh feel.',
        price: '349.00',
        imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
      },
      {
        name: 'Skin Care Serum',
        description: 'Lightweight skin care serum for a simple daily skin care routine.',
        price: '899.00',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
      },
      {
        name: 'Bath & Body Set',
        description: 'A practical body care set for everyday personal care.',
        price: '1299.00',
        imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519',
      },
    ],
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Fitness equipment and accessories for active lifestyles.',
    products: [
      {
        name: 'Yoga Mat',
        description: 'Non-slip exercise mat suitable for yoga, stretching, and workouts.',
        price: '999.00',
        imageUrl: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c7',
      },
      {
        name: 'Adjustable Dumbbells',
        description: 'Compact dumbbells for strength training and home workouts.',
        price: '2499.00',
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
      },
      {
        name: 'Sports Water Bottle',
        description: 'Reusable water bottle for gym sessions and outdoor activities.',
        price: '499.00',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes designed for daily training and exercise.',
        price: '2799.00',
        imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2',
      },
      {
        name: 'Resistance Bands Set',
        description: 'Resistance bands for strength training, mobility, and warm-ups.',
        price: '599.00',
        imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc',
      },
    ],
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books for learning, entertainment, and personal development.',
    products: [
      {
        name: 'The Art of Productivity',
        description: 'A practical guide to improving focus, habits, and personal productivity.',
        price: '499.00',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
      },
      {
        name: 'Mystery Novel',
        description: 'An engaging mystery story filled with twists and unexpected discoveries.',
        price: '349.00',
        imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e',
      },
      {
        name: 'Technology & Innovation',
        description: 'Explore technology trends and the ideas shaping the modern world.',
        price: '699.00',
        imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
      },
      {
        name: 'Personal Finance Guide',
        description: 'A beginner-friendly guide to budgeting, saving, and managing money.',
        price: '399.00',
        imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d',
      },
      {
        name: 'Travel Photography Book',
        description: 'A collection of travel photography and inspiration from around the world.',
        price: '899.00',
        imageUrl: 'https://images.unsplash.com/photo-1473181488828-8d4d6b7c1e2a',
      },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Everyday accessories for work, travel, and personal use.',
    products: [
      {
        name: 'Backpack',
        description: 'Everyday backpack with spacious compartments for work and travel.',
        price: '1799.00',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
      },
      {
        name: 'Travel Organizer',
        description: 'Compact organizer for storing travel essentials and accessories.',
        price: '699.00',
        imageUrl: 'https://images.unsplash.com/photo-1553531384-411a247ccd7c',
      },
      {
        name: 'Premium Notebook',
        description: 'Hardcover notebook for notes, journaling, and planning.',
        price: '299.00',
        imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57',
      },
      {
        name: 'Desk Organizer',
        description: 'Minimal desk organizer for keeping stationery and workspace essentials tidy.',
        price: '799.00',
        imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
      },
      {
        name: 'Reusable Tote Bag',
        description: 'Lightweight reusable tote bag for shopping and everyday errands.',
        price: '349.00',
        imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a3f4b2e',
      },
    ],
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Kitchen essentials and accessories for everyday cooking.',
    products: [
      {
        name: 'Stainless Steel Cookware Set',
        description: 'Durable cookware set for preparing everyday meals.',
        price: '3499.00',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba',
      },
      {
        name: 'Electric Kettle',
        description: 'Electric kettle for quickly boiling water for tea and coffee.',
        price: '1299.00',
        imageUrl: 'https://images.unsplash.com/photo-1594213114663-d94f6a7c3a4b',
      },
      {
        name: 'Chef Knife',
        description: 'Versatile kitchen knife for slicing, chopping, and food preparation.',
        price: '899.00',
        imageUrl: 'https://images.unsplash.com/photo-1593618998160-e340a1b7f6e1',
      },
      {
        name: 'Glass Storage Containers',
        description: 'Reusable glass containers for storing prepared food and ingredients.',
        price: '999.00',
        imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc',
      },
      {
        name: 'French Press Coffee Maker',
        description: 'Classic French press for brewing rich coffee at home.',
        price: '799.00',
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5',
      },
    ],
  },
];

async function main() {
  console.log('Starting database seed...');

  for (const categoryData of categories) {
    const category = await db.orm.public.Category.where({
      slug: categoryData.slug,
    }).upsert({
      update: {
        name: categoryData.name,
        description: categoryData.description,
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
      },
    });

    console.log(`Category: ${category.name}`);

    for (const productData of categoryData.products) {
      const existingProduct = await db.orm.public.Product.where({
        name: productData.name,
        categoryId: category.id,
      }).first();

      const productPayload = {
        description: productData.description,
        price: productData.price,
        imageUrl: productData.imageUrl,
        status: 'ACTIVE' as const,
        categoryId: category.id,
      };

      if (existingProduct) {
        await db.orm.public.Product.where({ id: existingProduct.id }).update({
          ...productPayload,
        });
      } else {
        await db.orm.public.Product.create({
          name: productData.name,
          ...productPayload,
        });
      }
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
