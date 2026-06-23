import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentEvent extends Document {
  tenantId: string;
  eventId: string;
  orderId: mongoose.Types.ObjectId;
  processedAt: Date;
}

const paymentEventSchema = new Schema<IPaymentEvent>(
  {
    tenantId: { type: String, required: true },
    // Unique eventId is the idempotency gate — a duplicate webhook hits this index
    // and aborts, so a payment is processed exactly once.
    eventId: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const PaymentEvent = mongoose.model<IPaymentEvent>(
  'PaymentEvent',
  paymentEventSchema,
);
