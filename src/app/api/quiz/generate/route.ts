import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { generateAdaptiveQuiz } from "@/lib/services/quiz-engine";
import { checkRateLimit } from "@/lib/ratelimit";
import { NotFoundError, handleApiError } from "@/lib/errors";

const generateQuizSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  questionCount: z.number().int().min(1).max(10).default(4),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limit quiz generation (10 / min)
    await checkRateLimit(`quiz_gen_${user.id}`, 10, 60);

    const body = await req.json();
    const validated = generateQuizSchema.parse(body);

    await connectToDatabase();
    const project = await Project.findById(validated.projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    verifyOwnership(project.userId, user.id);

    const questions = await generateAdaptiveQuiz({
      userId: user.id,
      projectId: validated.projectId,
      questionCount: validated.questionCount,
    });

    // Strip answers from frontend quiz payload to prevent cheating
    const sanitizedQuestions = questions.map((q) => ({
      id: q._id.toString(),
      conceptId: q.conceptId.toString(),
      questionText: q.questionText,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
      citationHint: q.citationHint,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedQuestions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
