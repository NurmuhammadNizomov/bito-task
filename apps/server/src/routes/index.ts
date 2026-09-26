import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import productRoutes from '../modules/products/product.routes';
import orderRoutes from '../modules/orders/order.routes';
import webhookRoutes from '../modules/payments/webhook.routes';
import receiptRoutes from '../modules/receipts/receipt.routes';
import reportRoutes from '../modules/reports/report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/orders', receiptRoutes);
router.use('/reports', reportRoutes);

export { router as routes };
