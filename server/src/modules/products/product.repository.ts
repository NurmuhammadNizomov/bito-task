import mongoose from 'mongoose';
import { Product } from './product.model';

const cashierSelect = 'name sku salePrice stock';

interface FindAllParams {
  tenantId: string;
  search?: string;
  skip: number;
  limit: number;
}

export async function findAll({ tenantId, search, skip, limit }: FindAllParams) {
  const filter: Record<string, unknown> = { tenantId, isActive: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  return Product.find(filter)
    .select(cashierSelect)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function countAll(tenantId: string, search?: string) {
  const filter: Record<string, unknown> = { tenantId, isActive: true };
  if (search) {
    // Must mirror findAll's $or exactly (incl. sku) or the paginated total
    // diverges from the listed rows when searching by SKU.
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }
  return Product.countDocuments(filter);
}

export async function findByIds(ids: string[], tenantId: string, session?: mongoose.ClientSession) {
  return Product.find({ _id: { $in: ids }, tenantId, isActive: true })
    .select('_id name salePrice costPrice sku')
    .session(session || null)
    .lean();
}

/**
 * Atomic, oversell-safe stock decrement. The `stock: { $gte: quantity }` guard means
 * the update matches no document when stock is insufficient, so `stock` can never go
 * negative even under concurrent checkout. Returns false when the guard blocked it.
 */
export async function decrementStock(
  productId: string,
  tenantId: string,
  quantity: number,
  session?: mongoose.ClientSession,
): Promise<boolean> {
  const res = await Product.updateOne(
    { _id: productId, tenantId, isActive: true, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { session },
  );
  return res.modifiedCount === 1;
}
