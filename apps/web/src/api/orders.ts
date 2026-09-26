import api from '../lib/axios';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  _id: string;
  status: string;
  total: number;
  products: { productId: { _id: string; name: string }; quantity: number; unitPriceAtPurchase: number }[];
  createdAt: string;
}

export async function createOrder(products: OrderItem[]) {
  const res = await api.post<{ success: boolean; data: Order }>('/orders', { products });
  return res.data.data;
}

export async function getOrderById(id: string) {
  const res = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
  return res.data.data;
}

// Demo: simulate the payment provider confirming this order.
export async function payOrder(id: string) {
  const res = await api.post<{ success: boolean; data: unknown }>(`/orders/${id}/pay`);
  return res.data.data;
}
