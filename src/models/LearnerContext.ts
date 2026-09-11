import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILearnerContext extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  learnedFacts: string[];
  recentTopicsStudied: string[];
  metacognitiveProfile: {
    overconfidenceTendency: number; // 0 (calibrated) to 10 (high overconfidence)
    lastUpdated: Date;
  };
  summary: string;
  updatedAt: Date;
}

const LearnerContextSchema = new Schema<ILearnerContext>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    goals: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    learnedFacts: [{ type: String }],
    recentTopicsStudied: [{ type: String }],
    metacognitiveProfile: {
      overconfidenceTendency: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    summary: { type: String, default: "New learner profile initialized." },
  },
  {
    timestamps: true,
  }
);

LearnerContextSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const LearnerContext: Model<ILearnerContext> =
  mongoose.models.LearnerContext || mongoose.model<ILearnerContext>("LearnerContext", LearnerContextSchema);
