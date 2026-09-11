import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Environment Configuration & Validation", () => {
  const testSchema = z.object({
    MONGODB_URI: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  });

  it("successfully parses valid environment variables", () => {
    const validEnv = {
      MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/test",
      GOOGLE_CLIENT_ID: "client-id-123",
      GOOGLE_CLIENT_SECRET: "client-secret-abc",
      AUTH_SECRET: "secure-auth-secret-32-characters-long",
      GEMINI_API_KEY: "gemini-api-key-test",
    };

    const parsed = testSchema.safeParse(validEnv);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.GEMINI_MODEL).toBe("gemini-2.5-flash");
      expect(parsed.data.GEMINI_EMBEDDING_MODEL).toBe("gemini-embedding-001");
    }
  });

  it("fails validation when critical credentials are missing", () => {
    const invalidEnv = {
      MONGODB_URI: "",
      GOOGLE_CLIENT_ID: "client-id-123",
    };

    const parsed = testSchema.safeParse(invalidEnv);
    expect(parsed.success).toBe(false);
  });
});
