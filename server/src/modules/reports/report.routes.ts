import { Router } from 'express';
import { getSalesReport } from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/sales', requireRole('ADMIN'), getSalesReport);

export default router;
