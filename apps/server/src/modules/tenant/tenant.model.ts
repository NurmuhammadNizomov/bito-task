import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  settings: {
    currency: string;
    timezone: string;
    dateFormat: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    settings: {
      currency: { type: String, default: 'UZS' },
      timezone: { type: String, default: 'Asia/Tashkent' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
    },
  },
  { timestamps: true, versionKey: false },
);

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
