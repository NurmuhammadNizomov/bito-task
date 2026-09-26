import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus } from '../../common/constants/order-status';
import type { OrderStatus as OrderStatusType } from '../../common/constants/order-status';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPriceAtPurchase: number;
  costPriceAtPurchase: number;
}

export interface IOrder extends Document {
  cashierId: mongoose.Types.ObjectId;
  tenantId: string;
  products: IOrderItem[];
  total: number;
  status: OrderStatusType;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPriceAtPurchase: { type: Number, required: true },
    costPriceAtPurchase: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: String, required: true },
    products: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
    },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
