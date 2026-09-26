import mongoose from 'mongoose';
import { Order } from '../orders/order.model';
import { AppError } from '../../middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';

interface ReceiptOrderProduct {
  productId: mongoose.Types.ObjectId | { _id: string; name: string };
  quantity: number;
  unitPriceAtPurchase: number;
}

const receiptSelect = {
  _id: 1,
  cashierId: 1,
  tenantId: 1,
  status: 1,
  total: 1,
  createdAt: 1,
  paidAt: 1,
  'products.productId': 1,
  'products.quantity': 1,
  'products.unitPriceAtPurchase': 1,
};

export async function generateReceipt(orderId: string, tenantId: string) {
  const order = await Order.findOne({ _id: orderId, tenantId })
    .select(receiptSelect)
    .populate('products.productId', 'name')
    .lean();

  if (!order) throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');

  if (order.status !== 'paid') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Receipt only available for paid orders');
  }

  const items = order.products.map((p: ReceiptOrderProduct) => {
    const productName = 'name' in p.productId ? p.productId.name : 'Unknown';
    return {
      productName,
      quantity: p.quantity,
      unitPrice: p.unitPriceAtPurchase,
      totalPrice: p.unitPriceAtPurchase * p.quantity,
    };
  });

  return {
    orderId: order._id,
    status: order.status,
    items,
    total: order.total,
    issuedAt: order.createdAt,
    paidAt: order.paidAt,
  };
}
