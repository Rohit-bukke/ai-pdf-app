import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Material } from "@/models/Material";
import { NotFoundError, handleApiError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const material = await Material.findById(params.materialId);
    if (!material) {
      throw new NotFoundError("Material not found");
    }

    verifyOwnership(material.userId, user.id);

    return NextResponse.json({
      success: true,
      data: {
        materialId: material._id,
        status: material.status,
        pageCount: material.pageCount,
        chunkCount: material.chunkCount,
        errorMessage: material.errorMessage,
        updatedAt: material.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
