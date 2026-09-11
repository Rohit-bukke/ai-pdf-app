import mongoose, { Schema, Model } from "mongoose";

// Plain interface (not extending Document) to avoid conflict with Mongoose's reserved `model` property
export interface IEvaluation {
  _id?: mongoose.Types.ObjectId;
  runId: string;
  testCaseId: string;
  promptVersion: string;
  /** The AI model used (named aiModel to avoid clash with Mongoose Document.model) */
  aiModel: string;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  expectedCitation?: string;
  actualCitation?: string;
  groundednessScore: number; // 0 - 100
  citationAccuracyScore: number; // 0 - 100
  unsupportedHandlingScore: number; // 0 - 100
  latencyMs: number;
  passed: boolean;
  notes?: string;
  createdAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    runId: { type: String, required: true, index: true },
    testCaseId: { type: String, required: true },
    promptVersion: { type: String, required: true },
    aiModel: { type: String, required: true },
    question: { type: String, required: true },
    expectedAnswer: { type: String, required: true },
    actualAnswer: { type: String, required: true },
    expectedCitation: { type: String },
    actualCitation: { type: String },
    groundednessScore: { type: Number, required: true },
    citationAccuracyScore: { type: Number, required: true },
    unsupportedHandlingScore: { type: Number, required: true },
    latencyMs: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EvaluationSchema.index({ runId: 1, createdAt: -1 });

export const Evaluation: Model<IEvaluation> =
  mongoose.models.Evaluation || mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
