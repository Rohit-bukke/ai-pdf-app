import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { askAiTutor } from "@/lib/services/rag-tutor";
import { checkRateLimit } from "@/lib/ratelimit";
import { NotFoundError, handleApiError } from "@/lib/errors";

const tutorQuestionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  question: z.string().min(2, "Question must be at least 2 characters long").max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // 1. Rate Limit AI Calls (20 queries/min per user)
    await checkRateLimit(`tutor_${user.id}`, 20, 60);

    const body = await req.json();
    const validated = tutorQuestionSchema.parse(body);

    await connectToDatabase();
    const project = await Project.findById(validated.projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // 2. Ownership verification
    verifyOwnership(project.userId, user.id);

    // 3. Grounded RAG Retrieval + Answer Generation
    const result = await askAiTutor({
      userId: user.id,
      projectId: validated.projectId,
      question: validated.question,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
