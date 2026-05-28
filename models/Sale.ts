import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SaleSchema = new Schema(
  {
    phone:       { type: String, required: true },
    channel:     { type: String, required: true },
    sale_date:   { type: Date,   default: null },
    center_name: { type: String, default: null },
    imported_at: { type: Date,   default: () => new Date() },
  },
  { timestamps: false },
);

SaleSchema.index({ phone: 1 });
SaleSchema.index({ phone: 1, channel: 1 });

export type SaleDoc = InferSchemaType<typeof SaleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Sale =
  (mongoose.models.Sale as mongoose.Model<SaleDoc>) ||
  mongoose.model<SaleDoc>("Sale", SaleSchema);
