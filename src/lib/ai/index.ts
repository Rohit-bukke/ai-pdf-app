import { GeminiProvider } from "./gemini-provider";
import { IAIProvider } from "./ai-provider.interface";

// Singleton AI Provider instance
export const aiProvider: IAIProvider = new GeminiProvider();

export * from "./ai-provider.interface";
export * from "./gemini-provider";
