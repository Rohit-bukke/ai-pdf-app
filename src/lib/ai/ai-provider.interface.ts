import { z } from "zod";

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  projectId?: string;
  feature?: "RAG_TUTOR" | "CONTEXT_DISTILLATION" | "RECOMMENDATION" | "QUIZ_GENERATION" | "QUIZ_GRADING";
}

export interface GenerateTextResult {
  text: string;
  usage: AIUsageMetrics;
  latencyMs: number;
  model: string;
}

export interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  systemInstruction?: string;
  temperature?: number;
  userId?: string;
  projectId?: string;
  feature?: "RAG_TUTOR" | "CONTEXT_DISTILLATION" | "RECOMMENDATION" | "QUIZ_GENERATION" | "QUIZ_GRADING";
}

export interface GenerateStructuredResult<T> {
  data: T;
  rawText: string;
  usage: AIUsageMetrics;
  latencyMs: number;
  model: string;
}

export interface EmbedResult {
  embedding: number[];
  latencyMs: number;
  model: string;
}

export interface EmbedBatchResult {
  embeddings: number[][];
  latencyMs: number;
  model: string;
}

export interface IAIProvider {
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<GenerateStructuredResult<T>>;
  embed(text: string, userId?: string, projectId?: string): Promise<EmbedResult>;
  embedBatch(texts: string[], userId?: string, projectId?: string): Promise<EmbedBatchResult>;
}
