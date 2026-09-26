import { Router } from 'express';
import { getReceipt } from './receipt.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/:orderId/receipt', getReceipt);

export default router;
