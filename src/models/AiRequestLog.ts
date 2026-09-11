import mongoose, { Schema, Model } from "mongoose";

// Use a plain interface (not extending Document) to avoid clash with Mongoose's reserved `model` property
export interface IAiRequestLog {
  _id?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  feature: "RAG_TUTOR" | "EMBEDDING" | "QUIZ_GENERATION" | "QUIZ_GRADING" | "CONTEXT_DISTILLATION" | "RECOMMENDATION";
  /** The AI model identifier (named aiModel to avoid clash with Mongoose Document.model) */
  aiModel: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  success: boolean;
  errorMessage?: string;
  requestId: string;
  createdAt?: Date;
}

const AiRequestLogSchema = new Schema<IAiRequestLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    feature: { type: String, required: true, index: true },
    aiModel: { type: String, required: true },
    latencyMs: { type: Number, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    success: { type: Boolean, required: true, index: true },
    errorMessage: { type: String },
    requestId: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AiRequestLogSchema.index({ createdAt: -1 });
AiRequestLogSchema.index({ feature: 1, createdAt: -1 });

export const AiRequestLog: Model<IAiRequestLog> =
  mongoose.models.AiRequestLog || mongoose.model<IAiRequestLog>("AiRequestLog", AiRequestLogSchema);
