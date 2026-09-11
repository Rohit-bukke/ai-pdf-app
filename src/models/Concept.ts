import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConcept extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  dependencies: mongoose.Types.ObjectId[]; // Directed Acyclic Graph edges: prerequisite concepts
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConceptSchema = new Schema<IConcept>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    difficultyLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      default: "INTERMEDIATE",
    },
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Concept" }],
    orderIndex: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

ConceptSchema.index({ projectId: 1, name: 1 });

export const Concept: Model<IConcept> =
  mongoose.models.Concept || mongoose.model<IConcept>("Concept", ConceptSchema);
