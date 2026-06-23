import * as productRepo from './product.repository';
import { parsePagination } from '../../common/utils/pagination';

export async function getAllProducts(
  tenantId: string,
  query: { page?: string; limit?: string; search?: string },
) {
  const { page, limit, skip } = parsePagination(query);
  const [products, total] = await Promise.all([
    productRepo.findAll({ tenantId, search: query.search, skip, limit }),
    productRepo.countAll(tenantId, query.search),
  ]);
  return { data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export { productRepo };
