import { Router } from 'express';
import * as controller from './product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

// Search-only catalog read path. Products are seeded, not managed via the API.
router.get('/', controller.getAll);

export default router;
