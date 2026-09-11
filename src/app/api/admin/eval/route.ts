import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { runEvaluationSuite } from "@/lib/services/eval-harness";
import { handleApiError } from "@/lib/errors";

const evalRunSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  promptVersion: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const validated = evalRunSchema.parse(body);

    const summary = await runEvaluationSuite({
      projectId: validated.projectId,
      userId: user.id,
      promptVersion: validated.promptVersion,
    });

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
