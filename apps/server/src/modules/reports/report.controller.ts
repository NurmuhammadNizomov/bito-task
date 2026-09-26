import { Request, Response } from 'express';
import * as reportService from './report.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { ok } from '../../common/utils/api-response';

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const report = await reportService.generateSalesReport(
    req.user.tenantId,
    new Date(from),
    new Date(`${to}T23:59:59.999Z`),
  );
  ok(res, report, 'report.ready');
});
