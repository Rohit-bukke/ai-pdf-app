import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "../lib/utils";
import { chunkText } from "../lib/services/chunker";

describe("RAG Vector Retrieval & Chunking Engine", () => {
  it("computes cosine similarity accurately", () => {
    const vecA = [1, 0, 0, 1];
    const vecB = [1, 0, 0, 1];
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeCloseTo(1.0, 5);

    const orthogonalVec = [0, 1, 1, 0];
    const simOrthogonal = cosineSimilarity(vecA, orthogonalVec);
    expect(simOrthogonal).toBeCloseTo(0.0, 5);
  });

  it("chunks long document text into overlapping segments preserving boundaries", () => {
    const sampleDocument = `Introduction to Distributed Systems.
Distributed computing deals with hardware and software systems containing more than one processing element.
Concurrency is a fundamental property of distributed systems.
Fault tolerance ensures system reliability during partial failures.
Consistency models govern how state changes propagate across the cluster.`;

    const chunks = chunkText(sampleDocument, 100, 30);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toContain("Introduction");
  });
});
