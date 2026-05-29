import mongoose, { Schema, type InferSchemaType } from "mongoose";

const DncSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true },
    imported_at: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);

DncSchema.index({ phone: 1 });

export type DncDoc = InferSchemaType<typeof DncSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Dnc =
  (mongoose.models.Dnc as mongoose.Model<DncDoc>) ||
  mongoose.model<DncDoc>("Dnc", DncSchema);
