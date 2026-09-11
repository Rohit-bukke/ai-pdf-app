import { z } from "zod";

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Redis & Rate Limiting (optional in pure mock/local dev without network, but required for production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),

  // Authentication
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Storage
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),

  // AI Configuration
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),

  // Observability
  SENTRY_DSN: z.string().optional().or(z.literal("")),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional().or(z.literal("")),
  INNGEST_SIGNING_KEY: z.string().optional().or(z.literal("")),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

// Safe fallback used during Next.js build-time static analysis
// (NEXT_PHASE=phase-production-build) when env vars aren't available to the worker.
const BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formattedErrors = parsed.error.format();
    const missingKeys = Object.keys(formattedErrors)
      .filter((k) => k !== "_errors")
      .join(", ");

    // During next build static analysis phase, return safe defaults instead of crashing.
    // At runtime (dev or production server start), critical keys must be present.
    if (BUILD_PHASE) {
      console.warn(
        `[ENV] Build-phase stub — missing keys will be checked at runtime: ${missingKeys}`
      );
      return {
        MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-pdf-app-stub",
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "build-stub-client-id",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "build-stub-client-secret",
        AUTH_SECRET: process.env.AUTH_SECRET || "build-stub-auth-secret-32-chars-long-padding",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
        SUPABASE_URL: process.env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "build-stub-gemini-key",
        GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
        SENTRY_DSN: process.env.SENTRY_DSN || "",
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || "",
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY || "",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
      };
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `CRITICAL: Invalid environment configuration. Missing/invalid keys: ${missingKeys}`
      );
    } else {
      console.warn(`[ENV WARNING] Missing or invalid environment keys: ${missingKeys}. Falling back to dev defaults.`);
      return {
        MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-pdf-app",
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "dev-google-client-id",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "dev-google-client-secret",
        AUTH_SECRET: process.env.AUTH_SECRET || "dev-auth-secret-32-chars-long-fallback-key",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
        SUPABASE_URL: process.env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "dev-gemini-key",
        GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
        SENTRY_DSN: process.env.SENTRY_DSN || "",
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || "",
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY || "",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
      };
    }
  }

  return parsed.data;
}

export const env = validateEnv();
