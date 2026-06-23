import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    salePrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    tenantId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, sku: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
