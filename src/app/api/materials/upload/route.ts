import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { Material } from "@/models/Material";
import { uploadPdfToStorage, validatePdfFile } from "@/lib/storage/supabase";
import { checkRateLimit } from "@/lib/ratelimit";
import { processPdfDocument } from "@/lib/services/pdf-processor";
import { inngest } from "@/lib/inngest/client";
import { NotFoundError, BadRequestError, handleApiError } from "@/lib/errors";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // 1. Rate Limit Upload Initiation (max 10 uploads per 60 seconds per user)
    await checkRateLimit(`upload_${user.id}`, 10, 60);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      throw new BadRequestError("Both 'file' and 'projectId' are required in form data.");
    }

    await connectToDatabase();
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // 2. Authorization Ownership Check
    verifyOwnership(project.userId, user.id);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Server-side PDF validation (signature and size <= 20MB)
    validatePdfFile(buffer, file.size);

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = crypto.randomUUID().substring(0, 8);
    const storagePath = `${user.id}/${projectId}/${uniqueId}-${sanitizedFilename}`;

    // 4. Upload to Private Supabase Storage
    await uploadPdfToStorage(storagePath, buffer, "application/pdf");

    // 5. Create Material record in QUEUED state
    const material = await Material.create({
      userId: user.id,
      projectId: project._id,
      filename: `${uniqueId}-${sanitizedFilename}`,
      originalName: file.name,
      mimeType: "application/pdf",
      sizeBytes: file.size,
      storagePath,
      status: "QUEUED",
    });

    // 6. Asynchronously trigger processing
    // If Inngest is configured, send event; also run local processor asynchronously
    try {
      if (process.env.INNGEST_EVENT_KEY) {
        await inngest.send({
          name: "material/uploaded",
          data: {
            materialId: material._id.toString(),
            base64Buffer: buffer.toString("base64"),
          },
        });
      } else {
        // Run asynchronously without blocking HTTP response
        setImmediate(() => {
          processPdfDocument(material._id.toString(), buffer).catch((err) => {
            console.error("[Async PDF Pipeline Error]:", err);
          });
        });
      }
    } catch (inngestErr) {
      // Fallback local async processing
      setImmediate(() => {
        processPdfDocument(material._id.toString(), buffer).catch((err) => {
          console.error("[Async PDF Pipeline Error]:", err);
        });
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          materialId: material._id,
          status: material.status,
          originalName: material.originalName,
          sizeBytes: material.sizeBytes,
        },
      },
      { status: 202 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
