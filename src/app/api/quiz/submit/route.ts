import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { evaluateQuizSubmission } from "@/lib/services/quiz-engine";
import { NotFoundError, handleApiError } from "@/lib/errors";

const submitQuizSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        userAnswer: z.string().min(1),
        confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
      })
    )
    .min(1, "At least one answer must be submitted"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = submitQuizSchema.parse(body);

    await connectToDatabase();
    const project = await Project.findById(validated.projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    verifyOwnership(project.userId, user.id);

    const result = await evaluateQuizSubmission({
      userId: user.id,
      projectId: validated.projectId,
      answers: validated.answers,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
