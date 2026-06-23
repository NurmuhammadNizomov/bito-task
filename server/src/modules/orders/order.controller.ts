import { Request, Response } from 'express';
import * as orderService from './order.service';
import { simulateProviderPayment } from '../payments/webhook.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { ok, created } from '../../common/utils/api-response';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getAllOrders(req.user.tenantId);
  ok(res, orders, 'order.list');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id as string, req.user.tenantId);
  ok(res, order);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.body, req.user.tenantId, req.user.userId);
  created(res, order, 'order.created');
});

// Demo-only: simulate the payment provider's signed webhook for this order.
export const pay = asyncHandler(async (req: Request, res: Response) => {
  const result = await simulateProviderPayment(req.params.id as string, req.user.tenantId);
  ok(res, result, 'order.paid');
});
