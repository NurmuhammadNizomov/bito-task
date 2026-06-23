import { z } from 'zod';

export const salesReportQuerySchema = z.object({
  from: z.string().date('from must be a valid YYYY-MM-DD date').optional(),
  to: z.string().date('to must be a valid YYYY-MM-DD date').optional(),
});
