import { Order, IOrder } from './order.model';

const receiptSelect = '_id cashierId status total createdAt products.productId products.quantity products.unitPriceAtPurchase';

export async function findAll(tenantId: string) {
  return Order.find({ tenantId })
    .select(receiptSelect)
    .populate('products.productId', 'name')
    .sort({ createdAt: -1 })
    .lean();
}

export async function findById(id: string, tenantId: string) {
  return Order.findOne({ _id: id, tenantId })
    .select(receiptSelect)
    .populate('products.productId', 'name')
    .lean();
}

export async function createOrder(data: Partial<IOrder>) {
  return Order.create(data);
}

export async function updateStatus(id: string, tenantId: string, status: string) {
  return Order.findOneAndUpdate({ _id: id, tenantId }, { status }, { new: true }).lean();
}
