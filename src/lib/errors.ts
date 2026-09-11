import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { captureException } from "@/lib/sentry";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    const errorWithCapture = Error as unknown as {
      captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
    };
    errorWithCapture.captureStackTrace?.(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429);
  }
}

export function handleApiError(error: unknown) {
  // Capture to Sentry if not operational or unexpected
  try {
    if (!(error instanceof AppError) || !error.isOperational) {
      captureException(error);
    }
  } catch (sentryErr) {
    console.error("[Sentry Error Reporting Fallback]:", sentryErr);
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Generic 500 without leaking stack traces or internal secrets
  const genericMessage =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "An unexpected internal server error occurred.";

  return NextResponse.json(
    {
      success: false,
      error: genericMessage,
    },
    { status: 500 }
  );
}
