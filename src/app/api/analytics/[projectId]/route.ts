import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { getProjectAnalytics } from "@/lib/services/analytics-service";
import { NotFoundError, handleApiError } from "@/lib/errors";

export async function GET(
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

    const analytics = await getProjectAnalytics(user.id, params.projectId);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
