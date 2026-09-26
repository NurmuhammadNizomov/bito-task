import api from '../lib/axios';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  salePrice: number;
  stock: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function searchProducts(query: string, page = 1) {
  const res = await api.get<PaginatedResponse<Product>>('/products', {
    params: { search: query || undefined, page, limit: 20 },
  });
  return res.data;
}
