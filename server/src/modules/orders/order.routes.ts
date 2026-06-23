import { Router } from 'express';
import * as controller from './order.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema } from './order.validation';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createOrderSchema), controller.create);
router.post('/:id/pay', controller.pay);

export default router;
