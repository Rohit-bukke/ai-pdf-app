import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMastery extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  conceptId: mongoose.Types.ObjectId;
  masteryScore: number; // 0 - 100
  attemptsCount: number;
  correctCount: number;
  highConfidenceMistakes: number; // Metacognitive miscalibration indicator
  lastAssessedAt: Date;
  status: "NEEDS_ATTENTION" | "LEARNING" | "MASTERED";
  history: Array<{
    score: number;
    delta: number;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MasterySchema = new Schema<IMastery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    conceptId: { type: Schema.Types.ObjectId, ref: "Concept", required: true, index: true },
    masteryScore: { type: Number, default: 0, min: 0, max: 100 },
    attemptsCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    highConfidenceMistakes: { type: Number, default: 0 },
    lastAssessedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["NEEDS_ATTENTION", "LEARNING", "MASTERED"],
      default: "LEARNING",
    },
    history: [
      {
        score: { type: Number, required: true },
        delta: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

MasterySchema.index({ userId: 1, projectId: 1, conceptId: 1 }, { unique: true });

export const Mastery: Model<IMastery> =
  mongoose.models.Mastery || mongoose.model<IMastery>("Mastery", MasterySchema);
