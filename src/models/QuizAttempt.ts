import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizAttemptItem {
  questionId: mongoose.Types.ObjectId;
  conceptId: mongoose.Types.ObjectId;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  isCorrect: boolean;
  score: number; // 0 - 100
  aiFeedback?: string;
}

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  items: IQuizAttemptItem[];
  totalQuestions: number;
  correctCount: number;
  overallScore: number; // Percentage
  highConfidenceErrors: number;
  calibrationScore: number; // Index of how well confidence matches accuracy
  completedAt: Date;
  createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    items: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        conceptId: { type: Schema.Types.ObjectId, ref: "Concept", required: true },
        questionText: { type: String, required: true },
        userAnswer: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        confidence: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
        isCorrect: { type: Boolean, required: true },
        score: { type: Number, default: 0 },
        aiFeedback: { type: String },
      },
    ],
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    highConfidenceErrors: { type: Number, default: 0 },
    calibrationScore: { type: Number, default: 100 },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ userId: 1, projectId: 1, completedAt: -1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
