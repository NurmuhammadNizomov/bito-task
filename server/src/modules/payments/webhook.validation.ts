import { z } from 'zod';

export const webhookSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  orderId: z.string().min(1, 'orderId is required'),
  event: z.string().min(1, 'event is required'),
  tenantId: z.string().min(1).optional(),
  payload: z.object({}).passthrough(),
});
