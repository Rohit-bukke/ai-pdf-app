import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityEvent extends Document {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  spaceId?: mongoose.Types.ObjectId;
  eventType:
    | "SPACE_CREATED"
    | "PROJECT_CREATED"
    | "MATERIAL_UPLOADED"
    | "MATERIAL_PROCESSED"
    | "TUTOR_QUESTION_ASKED"
    | "QUIZ_COMPLETED"
    | "MASTERY_UPDATED"
    | "RECOMMENDATION_RESOLVED";
  title: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    spaceId: { type: Schema.Types.ObjectId, ref: "Space", index: true },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityEventSchema.index({ userId: 1, createdAt: -1 });

export const ActivityEvent: Model<IActivityEvent> =
  mongoose.models.ActivityEvent || mongoose.model<IActivityEvent>("ActivityEvent", ActivityEventSchema);
