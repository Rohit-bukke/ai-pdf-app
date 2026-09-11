import * as Sentry from "@sentry/nextjs";
import { env } from "./env";

export function initSentry() {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      environment: env.NODE_ENV,
      beforeSend(event) {
        // Strip sensitive authorization headers, cookies, and secrets before transmitting
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else if (env.NODE_ENV !== "test") {
    console.error("[Observability Log]:", error, context || "");
  }
}

export function logAiMetric(metadata: {
  userId?: string;
  feature: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  success: boolean;
  costUsd?: number;
}) {
  if (env.NODE_ENV !== "test") {
    console.info(`[AI METRIC] ${metadata.feature} | ${metadata.model} | ${metadata.latencyMs}ms | Success: ${metadata.success}`);
  }
}
