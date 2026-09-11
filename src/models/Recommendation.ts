import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  conceptId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionType: "REVIEW_PREREQUISITE" | "PRACTICE_QUESTIONS" | "DEEP_DIVE_MATERIAL" | "CALIBRATE_CONFIDENCE";
  rationale: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    conceptId: { type: Schema.Types.ObjectId, ref: "Concept", index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
    actionType: {
      type: String,
      enum: ["REVIEW_PREREQUISITE", "PRACTICE_QUESTIONS", "DEEP_DIVE_MATERIAL", "CALIBRATE_CONFIDENCE"],
      required: true,
    },
    rationale: { type: String, required: true },
    isResolved: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

RecommendationSchema.index({ userId: 1, projectId: 1, isResolved: 1 });

export const Recommendation: Model<IRecommendation> =
  mongoose.models.Recommendation || mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
