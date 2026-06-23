import { Request, Response } from 'express';
import * as productService from './product.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { paginated } from '../../common/utils/api-response';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as { page?: string; limit?: string; search?: string };
  const result = await productService.getAllProducts(req.user.tenantId, query);
  paginated(res, result.data, result.pagination, 'product.list');
});
