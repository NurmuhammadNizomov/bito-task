import api from '../lib/axios';

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  orderId: string;
  status: string;
  items: ReceiptItem[];
  total: number;
  issuedAt: string;
}

export async function getReceipt(orderId: string) {
  const res = await api.get<{ success: boolean; data: Receipt }>(`/orders/${orderId}/receipt`);
  return res.data.data;
}
