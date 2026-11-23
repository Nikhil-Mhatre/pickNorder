import { Models } from '../../prisma/contract.js';
import { db } from '../../prisma/db.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { ProductNotFoundError } from '../../shared/errors/product-not-found.error.js';

type ProductT = Scalars<Models.public_Product>;

export async function getProductById(productId: string): Promise<ProductT> {
  const product = await db.orm.public.Product.where({
    id: productId,
    isActive: true,
  })
    .include('category')
    .first();

  if (!product) throw new ProductNotFoundError(productId);

  return product;
}
