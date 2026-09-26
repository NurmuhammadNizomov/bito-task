import { Router } from 'express';
import { handleWebhook } from './webhook.controller';
import { validate } from '../../middleware/validate.middleware';
import { webhookSchema } from './webhook.validation';

const router = Router();

router.post('/payment', validate(webhookSchema), handleWebhook);

export default router;
