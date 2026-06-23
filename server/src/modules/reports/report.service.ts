import { Order } from '../orders/order.model';
import { getCache, setCache, delByPrefix } from '../../common/utils/cache';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../middleware/error.middleware';

interface ReportItem {
  productName: string;
  quantity: number;
  revenue: number;
  cost: number;
  margin: number;
}

interface SalesReportResult {
  from: Date;
  to: Date;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  items: ReportItem[];
}

export async function generateSalesReport(tenantId: string, start: Date, end: Date): Promise<SalesReportResult> {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid from/to date');
  }
  if (start > end) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Start date must be before end date');
  }

  const cacheKey = `sales:${tenantId}:${start.toISOString()}:${end.toISOString()}`;

  const cached = await getCache<SalesReportResult>(cacheKey);
  if (cached) return cached;

  // Single pipeline: $facet computes the top-products list and the grand totals
  // in one pass over the same matched/grouped data — one round-trip, one source.
  type Totals = { totalRevenue: number; totalCost: number; totalMargin: number };
  const [facet] = await Order.aggregate<{ items: ReportItem[]; totals: Totals[] }>([
    {
      $match: {
        tenantId,
        status: 'paid',
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.productId',
        productName: { $first: { $ifNull: ['$products.productName', 'Deleted Product'] } },
        quantity: { $sum: '$products.quantity' },
        revenue: { $sum: { $multiply: ['$products.quantity', '$products.unitPriceAtPurchase'] } },
        cost: { $sum: { $multiply: ['$products.quantity', '$products.costPriceAtPurchase'] } },
      },
    },
    {
      $facet: {
        items: [
          {
            $project: {
              _id: 0,
              productName: 1,
              quantity: 1,
              revenue: { $round: ['$revenue', 0] },
              cost: { $round: ['$cost', 0] },
              margin: { $round: [{ $subtract: ['$revenue', '$cost'] }, 0] },
            },
          },
          { $sort: { quantity: -1 } },
        ],
        totals: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$revenue' },
              totalCost: { $sum: '$cost' },
            },
          },
          {
            $project: {
              _id: 0,
              totalRevenue: { $round: ['$totalRevenue', 0] },
              totalCost: { $round: ['$totalCost', 0] },
              totalMargin: { $round: [{ $subtract: ['$totalRevenue', '$totalCost'] }, 0] },
            },
          },
        ],
      },
    },
  ]);

  const totals = facet?.totals[0] ?? { totalRevenue: 0, totalCost: 0, totalMargin: 0 };

  const result: SalesReportResult = {
    from: start,
    to: end,
    totalRevenue: totals.totalRevenue,
    totalCost: totals.totalCost,
    totalMargin: totals.totalMargin,
    items: facet?.items ?? [],
  };

  await setCache(cacheKey, result, 300);
  return result;
}

export async function invalidateSalesCache(tenantId: string): Promise<void> {
  await delByPrefix(`sales:${tenantId}:`);
}
