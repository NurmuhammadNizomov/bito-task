import { PaymentEvent } from './payment-event.model';
import { Order } from '../orders/order.model';
import { verifySignature, signPayload } from '../../common/utils/hmac';
import { AppError } from '../../middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../common/utils/logger';
import { env } from '../../config/env';
import { invalidateSalesCache } from '../reports/report.service';
import { runInTransaction } from '../../common/utils/transaction';

interface WebhookPayload {
  eventId: string;
  orderId: string;
  event: string;
  tenantId?: string;
  payload: Record<string, unknown>;
}

function verifyHmac(body: string, signature: string): boolean {
  return verifySignature(body, signature, env.WEBHOOK_SECRET);
}

export async function handleWebhookEvent(rawBody: string, signature: string, data: WebhookPayload) {
  // Signature is delivered in the `X-Webhook-Signature` header and computed over the
  // exact raw request bytes — the body itself carries no signature field, so a real
  // provider can sign the payload before sending (no circular self-signing).
  if (!verifyHmac(rawBody, signature)) {
    logger.warn('Webhook HMAC verification failed', { eventId: data.eventId });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid webhook signature');
  }

  const existing = await PaymentEvent.findOne({ eventId: data.eventId }).lean();
  if (existing) {
    logger.info('Duplicate webhook, skipping', { eventId: data.eventId });
    return existing;
  }

  if (data.event !== 'payment.completed') {
    logger.info('Unknown webhook event', { eventId: data.eventId, event: data.event });
    return { acknowledged: true };
  }

  const order = await Order.findById(data.orderId).lean();
  if (!order) {
    logger.warn('Webhook: order not found yet, accepted for retry', { orderId: data.orderId });
    return { acknowledged: true, status: 'accepted' };
  }

  // Tenant boundary: a signed webhook still must not flip an order belonging to a
  // different tenant. When the provider includes tenantId, it must match the order.
  if (data.tenantId && order.tenantId !== data.tenantId) {
    logger.warn('Webhook: tenant mismatch', { orderId: data.orderId, expected: order.tenantId, got: data.tenantId });
    throw new AppError(StatusCodes.FORBIDDEN, 'Order does not belong to tenant');
  }

  if (order.status === 'paid') {
    logger.warn('Webhook: order already paid', { orderId: data.orderId });
    return { acknowledged: true };
  }

  // Transaction: insert the PaymentEvent and flip the order to `paid` atomically, so
  // a crash can never record the event without paying the order (or vice versa). The
  // unique `eventId` index is the idempotency gate — a duplicate webhook racing this
  // insert aborts on the duplicate-key error, so the `paid` transition happens exactly once.
  const paymentEvent = await runInTransaction(async (session) => {
    const [event] = await PaymentEvent.create(
      [{ tenantId: order.tenantId, eventId: data.eventId, orderId: data.orderId }],
      { session },
    );
    await Order.findByIdAndUpdate(data.orderId, { status: 'paid', paidAt: new Date() }, { session });
    return event;
  });

  await invalidateSalesCache(order.tenantId);

  logger.info('Payment confirmed', { eventId: data.eventId, orderId: data.orderId });
  return paymentEvent;
}

/**
 * Demo helper: stand in for the external payment provider. Verifies the order
 * belongs to the caller's tenant, then signs a webhook payload with WEBHOOK_SECRET
 * server-side and runs it through the same handleWebhookEvent path — so HMAC
 * verification and idempotency are exercised exactly as a real provider call.
 * The stable eventId makes repeated clicks idempotent (exactly one paid transition).
 */
export async function simulateProviderPayment(orderId: string, tenantId: string) {
  const order = await Order.findOne({ _id: orderId, tenantId }).lean();
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  const base = {
    eventId: `sim_${orderId}`,
    orderId,
    event: 'payment.completed',
    tenantId,
    payload: { simulated: true },
  };
  const rawBody = JSON.stringify(base);
  const signature = signPayload(rawBody, env.WEBHOOK_SECRET);

  return handleWebhookEvent(rawBody, signature, base);
}
