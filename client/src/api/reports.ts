import api from '../lib/axios';

export interface SalesReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  items: {
    productName: string;
    quantity: number;
    revenue: number;
    cost: number;
    margin: number;
  }[];
}

export async function getSalesReport(from: string, to: string) {
  const res = await api.get<{ success: boolean; data: SalesReport }>('/reports/sales', {
    params: { from, to },
  });
  return res.data.data;
}
