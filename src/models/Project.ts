import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  spaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  subject?: string;
  targetExam?: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    spaceId: { type: Schema.Types.ObjectId, ref: "Space", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    subject: { type: String, trim: true, maxlength: 100 },
    targetExam: { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ userId: 1, spaceId: 1, createdAt: -1 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
