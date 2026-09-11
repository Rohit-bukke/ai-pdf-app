import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpace extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    color: { type: String, default: "#4f46e5" },
    icon: { type: String, default: "folder" },
  },
  {
    timestamps: true,
  }
);

SpaceSchema.index({ userId: 1, createdAt: -1 });

export const Space: Model<ISpace> =
  mongoose.models.Space || mongoose.model<ISpace>("Space", SpaceSchema);
