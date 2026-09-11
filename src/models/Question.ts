import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  projectId: mongoose.Types.ObjectId;
  conceptId: mongoose.Types.ObjectId;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "OPEN_ENDED";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  citationHint?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    conceptId: { type: Schema.Types.ObjectId, ref: "Concept", required: true, index: true },
    questionText: { type: String, required: true },
    type: {
      type: String,
      enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_ENDED"],
      default: "MULTIPLE_CHOICE",
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    citationHint: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
