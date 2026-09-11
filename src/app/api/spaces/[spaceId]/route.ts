import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Space } from "@/models/Space";
import { Project } from "@/models/Project";
import { NotFoundError, handleApiError } from "@/lib/errors";

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const space = await Space.findById(params.spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    verifyOwnership(space.userId, user.id);

    return NextResponse.json({ success: true, data: space });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = updateSpaceSchema.parse(body);

    await connectToDatabase();
    const space = await Space.findById(params.spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    verifyOwnership(space.userId, user.id);

    Object.assign(space, validated);
    await space.save();

    return NextResponse.json({ success: true, data: space });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const space = await Space.findById(params.spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    verifyOwnership(space.userId, user.id);

    await Space.findByIdAndDelete(params.spaceId);
    // Cascade delete associated projects
    await Project.deleteMany({ spaceId: params.spaceId, userId: user.id });

    return NextResponse.json({ success: true, message: "Space deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
