import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChunk extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  embedding: number[];
  metadata?: {
    documentName: string;
    section?: string;
  };
  createdAt: Date;
}

const ChunkSchema = new Schema<IChunk>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true, index: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, required: true, default: 1 },
    content: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    embedding: { type: [Number], required: true },
    metadata: {
      documentName: { type: String, required: true },
      section: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for project-scoped queries
ChunkSchema.index({ projectId: 1, materialId: 1, chunkIndex: 1 });

export const Chunk: Model<IChunk> =
  mongoose.models.Chunk || mongoose.model<IChunk>("Chunk", ChunkSchema);
