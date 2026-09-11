import { connectToDatabase } from "../db/mongodb";
import { Material } from "@/models/Material";
import { Chunk } from "@/models/Chunk";
import { Concept } from "@/models/Concept";
import { aiProvider } from "../ai";
import { ActivityEvent } from "@/models/ActivityEvent";
import { z } from "zod";

export interface ChunkItem {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

import { chunkText } from "./chunker";
export { chunkText };

/**
 * Full PDF Processing Pipeline:
 * 1. Mark status PROCESSING
 * 2. Parse PDF buffer into text and pages
 * 3. Split into bounded chunks
 * 4. Generate Gemini embeddings for each chunk
 * 5. Persist Chunk models in MongoDB
 * 6. Extract core concepts for the project
 * 7. Mark status READY
 */
export async function processPdfDocument(
  materialId: string,
  pdfBuffer: Buffer
) {
  await connectToDatabase();
  const material = await Material.findById(materialId);
  if (!material) {
    throw new Error(`Material ${materialId} not found`);
  }

  try {
    material.status = "PROCESSING";
    await material.save();

    // 1. Parse PDF with dynamic import
    const pdfParse = (await import("pdf-parse")).default || (await import("pdf-parse"));
    const parsedPdf = await pdfParse(pdfBuffer);
    const pageCount = parsedPdf.numpages || 1;
    const rawText = parsedPdf.text || "";

    if (!rawText.trim()) {
      throw new Error("Document is empty or does not contain extractable text.");
    }

    // 2. Chunk text
    const textChunks = chunkText(rawText, 800, 150);

    if (textChunks.length === 0) {
      throw new Error("Failed to produce text chunks from document.");
    }

    // 3. Generate Gemini Embeddings in batches of 10
    const embeddings: number[][] = [];
    const BATCH_SIZE = 8;
    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
      const batch = textChunks.slice(i, i + BATCH_SIZE);
      const embedResult = await aiProvider.embedBatch(
        batch,
        material.userId.toString(),
        material.projectId.toString()
      );
      embeddings.push(...embedResult.embeddings);
    }

    // 4. Save Chunks into MongoDB
    // Estimate page numbers proportionally if exact per-page text isn't indexed
    const chunkDocs = textChunks.map((content, idx) => {
      const approxPage = Math.min(
        pageCount,
        Math.max(1, Math.ceil(((idx + 1) / textChunks.length) * pageCount))
      );
      return {
        userId: material.userId,
        projectId: material.projectId,
        materialId: material._id,
        chunkIndex: idx,
        pageNumber: approxPage,
        content,
        tokenCount: Math.ceil(content.length / 4),
        embedding: embeddings[idx] || [],
        metadata: {
          documentName: material.originalName,
          section: `Section ${idx + 1}`,
        },
      };
    });

    // Clean any previous chunks for idempotency
    await Chunk.deleteMany({ materialId: material._id });
    await Chunk.insertMany(chunkDocs);

    // 5. Asynchronously extract concepts for the project if few exist
    try {
      const existingConceptsCount = await Concept.countDocuments({ projectId: material.projectId });
      if (existingConceptsCount < 3) {
        await extractAndSaveConcepts(material.projectId.toString(), textChunks.slice(0, 5).join("\n\n"));
      }
    } catch (conceptErr) {
      console.warn("[PDF Processor] Concept extraction non-fatal error:", conceptErr);
    }

    // 6. Update Material status to READY
    material.status = "READY";
    material.pageCount = pageCount;
    material.chunkCount = chunkDocs.length;
    material.errorMessage = undefined;
    await material.save();

    // 7. Log Activity Event
    await ActivityEvent.create({
      userId: material.userId,
      projectId: material.projectId,
      eventType: "MATERIAL_PROCESSED",
      title: `Processed "${material.originalName}" (${pageCount} pages, ${chunkDocs.length} chunks)`,
      metadata: { materialId: material._id, chunkCount: chunkDocs.length, pageCount },
    });

    return {
      success: true,
      materialId: material._id,
      pageCount,
      chunkCount: chunkDocs.length,
    };
  } catch (error: any) {
    material.status = "FAILED";
    material.errorMessage = error.message || "Failed to process PDF document";
    await material.save();
    throw error;
  }
}

/**
 * Uses Gemini structured generation to extract key concepts and dependencies from material sample.
 */
async function extractAndSaveConcepts(projectId: string, sampleText: string) {
  const conceptSchema = z.object({
    concepts: z.array(
      z.object({
        name: z.string().min(2),
        description: z.string(),
        difficultyLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
      })
    ),
  });

  const prompt = `Analyze the following study material excerpt and extract 3 to 6 key foundational learning concepts:
  
<retrieved_content>
${sampleText.substring(0, 3000)}
</retrieved_content>

Return a structured list of concepts with name, short description, and difficulty level.`;

  const result = await aiProvider.generateStructured({
    prompt,
    schema: conceptSchema,
    systemInstruction: "You are an expert curriculum designer. Extract core academic concepts from the provided study material.",
    projectId,
    feature: "CONTEXT_DISTILLATION",
  });

  let previousId: any = null;
  for (const c of result.data.concepts) {
    const existing = await Concept.findOne({ projectId, name: c.name });
    if (!existing) {
      const created = await Concept.create({
        projectId,
        name: c.name,
        description: c.description,
        difficultyLevel: c.difficultyLevel,
        dependencies: previousId ? [previousId] : [],
      });
      previousId = created._id;
    } else {
      previousId = existing._id;
    }
  }
}
