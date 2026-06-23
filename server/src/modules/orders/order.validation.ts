import { z } from 'zod';

export const createOrderSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().min(1, 'productId is required'),
      quantity: z.number().int('quantity must be an integer').positive('quantity must be greater than 0'),
    }),
  ).min(1, 'Order must contain at least one product'),
});
