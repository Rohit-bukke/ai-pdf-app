import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import {
  IAIProvider,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateStructuredOptions,
  GenerateStructuredResult,
  EmbedResult,
  EmbedBatchResult,
} from "./ai-provider.interface";
import { env } from "../env";
import { AiRequestLog } from "@/models/AiRequestLog";
import { connectToDatabase } from "../db/mongodb";
import { logAiMetric } from "../sentry";

export class GeminiProvider implements IAIProvider {
  private client: GoogleGenerativeAI;
  private defaultModel: string;
  private embeddingModel: string;

  constructor(apiKey?: string, defaultModel?: string, embeddingModel?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    this.client = new GoogleGenerativeAI(key);
    this.defaultModel = defaultModel || env.GEMINI_MODEL;
    this.embeddingModel = embeddingModel || env.GEMINI_EMBEDDING_MODEL;
  }

  private async logRequest(meta: {
    userId?: string;
    projectId?: string;
    feature: "RAG_TUTOR" | "EMBEDDING" | "QUIZ_GENERATION" | "QUIZ_GRADING" | "CONTEXT_DISTILLATION" | "RECOMMENDATION";
    aiModel: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    success: boolean;
    errorMessage?: string;
  }) {
    const requestId = crypto.randomUUID();
    logAiMetric({
      userId: meta.userId,
      feature: meta.feature,
      model: meta.aiModel,
      latencyMs: meta.latencyMs,
      tokensUsed: meta.totalTokens,
      success: meta.success,
    });

    try {
      if (env.NODE_ENV !== "test") {
        await connectToDatabase();
        await AiRequestLog.create({
          ...meta,
          requestId,
        });
      }
    } catch (err) {
      // Non-blocking log failure
      console.warn("[AiRequestLog] Failed to persist log entry:", err);
    }
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: this.defaultModel,
      systemInstruction: options.systemInstruction,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    });

    try {
      const result = await model.generateContent(options.prompt);
      const latencyMs = Date.now() - start;
      const response = await result.response;
      const text = response.text();

      // Estimated token counts (approximated based on character count / standard ratio)
      const promptTokens = Math.ceil(options.prompt.length / 4);
      const completionTokens = Math.ceil(text.length / 4);
      const totalTokens = promptTokens + completionTokens;

      await this.logRequest({
        userId: options.userId,
        projectId: options.projectId,
        feature: options.feature || "RAG_TUTOR",
        aiModel: this.defaultModel,
        latencyMs,
        promptTokens,
        completionTokens,
        totalTokens,
        success: true,
      });

      return {
        text,
        usage: { promptTokens, completionTokens, totalTokens },
        latencyMs,
        model: this.defaultModel,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      await this.logRequest({
        userId: options.userId,
        projectId: options.projectId,
        feature: options.feature || "RAG_TUTOR",
        aiModel: this.defaultModel,
        latencyMs,
        success: false,
        errorMessage: err.message,
      });
      throw err;
    }
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<GenerateStructuredResult<T>> {
    const start = Date.now();
    const structuredSystemInstruction = `${options.systemInstruction || ""}\n\nIMPORTANT: You MUST respond ONLY with valid JSON conforming to the requested schema. Do not enclose the output in markdown fences or include introductory conversational text. Output pure, valid JSON.`;

    const model = this.client.getGenerativeModel({
      model: this.defaultModel,
      systemInstruction: structuredSystemInstruction,
      generationConfig: {
        temperature: options.temperature ?? 0.1,
        responseMimeType: "application/json",
      },
    });

    try {
      const result = await model.generateContent(options.prompt);
      const latencyMs = Date.now() - start;
      const response = await result.response;
      let rawText = response.text().trim();

      // Clean markdown codeblocks if model inadvertently added them
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsedJson = JSON.parse(rawText);
      const validatedData = options.schema.parse(parsedJson);

      const promptTokens = Math.ceil(options.prompt.length / 4);
      const completionTokens = Math.ceil(rawText.length / 4);
      const totalTokens = promptTokens + completionTokens;

      await this.logRequest({
        userId: options.userId,
        projectId: options.projectId,
        feature: options.feature || "QUIZ_GENERATION",
        aiModel: this.defaultModel,
        latencyMs,
        promptTokens,
        completionTokens,
        totalTokens,
        success: true,
      });

      return {
        data: validatedData,
        rawText,
        usage: { promptTokens, completionTokens, totalTokens },
        latencyMs,
        model: this.defaultModel,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      await this.logRequest({
        userId: options.userId,
        projectId: options.projectId,
        feature: options.feature || "QUIZ_GENERATION",
        aiModel: this.defaultModel,
        latencyMs,
        success: false,
        errorMessage: err.message,
      });
      throw err;
    }
  }

  async embed(text: string, userId?: string, projectId?: string): Promise<EmbedResult> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({ model: this.embeddingModel });

    try {
      const result = await model.embedContent(text);
      const latencyMs = Date.now() - start;
      const embedding = result.embedding.values;

      await this.logRequest({
        userId,
        projectId,
        feature: "EMBEDDING",
        aiModel: this.embeddingModel,
        latencyMs,
        promptTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil(text.length / 4),
        success: true,
      });

      return {
        embedding,
        latencyMs,
        model: this.embeddingModel,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      await this.logRequest({
        userId,
        projectId,
        feature: "EMBEDDING",
        aiModel: this.embeddingModel,
        latencyMs,
        success: false,
        errorMessage: err.message,
      });
      throw err;
    }
  }

  async embedBatch(texts: string[], userId?: string, projectId?: string): Promise<EmbedBatchResult> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({ model: this.embeddingModel });

    try {
      const embeddings: number[][] = [];
      // Process sequential / chunked to preserve rate limits
      for (const text of texts) {
        const res = await model.embedContent(text);
        embeddings.push(res.embedding.values);
      }

      const latencyMs = Date.now() - start;
      const totalChars = texts.reduce((acc, t) => acc + t.length, 0);

      await this.logRequest({
        userId,
        projectId,
        feature: "EMBEDDING",
        aiModel: this.embeddingModel,
        latencyMs,
        promptTokens: Math.ceil(totalChars / 4),
        totalTokens: Math.ceil(totalChars / 4),
        success: true,
      });

      return {
        embeddings,
        latencyMs,
        model: this.embeddingModel,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      await this.logRequest({
        userId,
        projectId,
        feature: "EMBEDDING",
        aiModel: this.embeddingModel,
        latencyMs,
        success: false,
        errorMessage: err.message,
      });
      throw err;
    }
  }
}
