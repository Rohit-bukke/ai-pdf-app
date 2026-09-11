import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { Material } from "@/models/Material";
import { Chunk } from "@/models/Chunk";
import { Concept } from "@/models/Concept";
import { Mastery } from "@/models/Mastery";
import { Recommendation } from "@/models/Recommendation";
import { NotFoundError, handleApiError } from "@/lib/errors";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  subject: z.string().max(100).optional(),
  targetExam: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const project = await Project.findById(params.projectId).populate("spaceId", "name color icon");
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    verifyOwnership(project.userId, user.id);

    // Fetch associated materials & concepts count
    const materials = await Material.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();
    const concepts = await Concept.find({ projectId: project._id }).lean();
    const masteries = await Mastery.find({ projectId: project._id, userId: user.id }).lean();

    return NextResponse.json({
      success: true,
      data: {
        ...project.toObject(),
        materials,
        concepts,
        masteries,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = updateProjectSchema.parse(body);

    await connectToDatabase();
    const project = await Project.findById(params.projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    verifyOwnership(project.userId, user.id);

    Object.assign(project, validated);
    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const project = await Project.findById(params.projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    verifyOwnership(project.userId, user.id);

    await Project.findByIdAndDelete(params.projectId);

    // Cascade delete project-scoped artifacts
    await Material.deleteMany({ projectId: params.projectId });
    await Chunk.deleteMany({ projectId: params.projectId });
    await Concept.deleteMany({ projectId: params.projectId });
    await Mastery.deleteMany({ projectId: params.projectId, userId: user.id });
    await Recommendation.deleteMany({ projectId: params.projectId, userId: user.id });

    return NextResponse.json({ success: true, message: "Project and all associated data deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
