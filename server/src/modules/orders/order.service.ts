import * as orderRepo from './order.repository';
import { productRepo } from '../products/product.service';
import { AppError } from '../../middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../common/utils/logger';
import { Order } from './order.model';
import { OrderStatus } from '../../common/constants/order-status';
import { runInTransaction } from '../../common/utils/transaction';

export async function getAllOrders(tenantId: string) {
  return orderRepo.findAll(tenantId);
}

export async function getOrderById(id: string, tenantId: string) {
  const order = await orderRepo.findById(id, tenantId);
  if (!order) throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  return order;
}

export async function createOrder(
  data: { products: { productId: string; quantity: number }[] },
  tenantId: string,
  userId: string,
) {
  if (!data.products || data.products.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order must contain at least one product');
  }

  interface OrderProductInput {
    productId: import('mongoose').Types.ObjectId;
    productName: string;
    quantity: number;
    unitPriceAtPurchase: number;
    costPriceAtPurchase: number;
  }

  // True multi-document transaction. Every read and write below runs in the same
  // session, so the order insert + each stock decrement either all commit together
  // or all abort. Each decrement is a `stock >= quantity`-guarded `$inc` — it can
  // never drive stock below zero, so two cashiers racing the last unit cannot both
  // win: the loser's guard matches no document and the whole transaction aborts,
  // leaving the DB exactly as it was. withTransaction also retries on write conflicts.
  const productIds = data.products.map((p) => p.productId);

  const result = await runInTransaction(async (session) => {
    const products = await productRepo.findByIds(productIds, tenantId, session);
    if (products.length !== productIds.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Some products not found or inactive');
    }

    const orderProducts: OrderProductInput[] = [];
    let total = 0;

    for (const item of data.products) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        throw new AppError(StatusCodes.BAD_REQUEST, `Product ${item.productId} not found`);
      }

      // Conditional decrement guards oversell. Server re-reads price/cost from the
      // DB here — never trusts client-supplied amounts.
      const ok = await productRepo.decrementStock(item.productId, tenantId, item.quantity, session);
      if (!ok) {
        throw new AppError(StatusCodes.CONFLICT, `Insufficient stock for ${product.name}`);
      }

      orderProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceAtPurchase: product.salePrice,
        costPriceAtPurchase: product.costPrice,
      });

      total += product.salePrice * item.quantity;
    }

    const [order] = await Order.create(
      [{ cashierId: userId, tenantId, products: orderProducts, total, status: OrderStatus.PENDING_PAYMENT }],
      { session },
    );

    return order;
  });

  logger.info('Order created', { orderId: result._id, total: result.total });

  // Never return costPriceAtPurchase to the client — strip it at the data layer
  // before the controller serializes the response. A cashier hitting POST /api/orders
  // must not reach cost/margin.
  return {
    _id: result._id,
    cashierId: result.cashierId,
    tenantId: result.tenantId,
    total: result.total,
    status: result.status,
    createdAt: result.createdAt,
    products: result.products.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      quantity: p.quantity,
      unitPriceAtPurchase: p.unitPriceAtPurchase,
    })),
  };
}

export async function updateOrderStatus(id: string, tenantId: string, status: string) {
  const order = await orderRepo.updateStatus(id, tenantId, status);
  if (!order) throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  logger.info('Order status updated', { orderId: id, status });
  return order;
}
