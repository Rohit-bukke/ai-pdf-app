import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  status: "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  errorMessage?: string;
  pageCount?: number;
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "READY", "FAILED"],
      default: "QUEUED",
      index: true,
    },
    errorMessage: { type: String },
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

MaterialSchema.index({ projectId: 1, createdAt: -1 });

export const Material: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>("Material", MaterialSchema);
