import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { Space } from "@/models/Space";
import { ActivityEvent } from "@/models/ActivityEvent";
import { NotFoundError, handleApiError } from "@/lib/errors";

const createProjectSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  name: z.string().min(1, "Project name is required").max(120),
  description: z.string().max(1000).optional(),
  subject: z.string().max(100).optional(),
  targetExam: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");

    await connectToDatabase();
    const query: Record<string, any> = { userId: user.id };
    if (spaceId) {
      query.spaceId = spaceId;
    }

    const projects = await Project.find(query)
      .populate("spaceId", "name color icon")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createProjectSchema.parse(body);

    await connectToDatabase();
    const space = await Space.findById(validated.spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify user owns the target space
    verifyOwnership(space.userId, user.id);

    const project = await Project.create({
      userId: user.id,
      spaceId: validated.spaceId,
      name: validated.name,
      description: validated.description,
      subject: validated.subject,
      targetExam: validated.targetExam,
      status: "ACTIVE",
    });

    await ActivityEvent.create({
      userId: user.id,
      spaceId: space._id,
      projectId: project._id,
      eventType: "PROJECT_CREATED",
      title: `Created project "${project.name}" in space "${space.name}"`,
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
