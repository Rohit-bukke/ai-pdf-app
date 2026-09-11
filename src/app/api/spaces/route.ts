import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Space } from "@/models/Space";
import { ActivityEvent } from "@/models/ActivityEvent";
import { handleApiError } from "@/lib/errors";

const createSpaceSchema = z.object({
  name: z.string().min(1, "Space name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const spaces = await Space.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: spaces });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createSpaceSchema.parse(body);

    await connectToDatabase();
    const space = await Space.create({
      userId: user.id,
      name: validated.name,
      description: validated.description,
      color: validated.color || "#4f46e5",
      icon: validated.icon || "folder",
    });

    await ActivityEvent.create({
      userId: user.id,
      spaceId: space._id,
      eventType: "SPACE_CREATED",
      title: `Created space "${space.name}"`,
    });

    return NextResponse.json({ success: true, data: space }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
