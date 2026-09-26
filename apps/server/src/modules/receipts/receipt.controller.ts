import { Request, Response } from 'express';
import * as receiptService from './receipt.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { ok } from '../../common/utils/api-response';

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await receiptService.generateReceipt(req.params.orderId as string, req.user.tenantId);
  ok(res, receipt, 'receipt.ready');
});
