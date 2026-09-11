import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/mongodb";

export async function GET() {
  const dbConnected = await checkDatabaseHealth();

  return NextResponse.json({
    status: dbConnected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? "connected" : "disconnected",
      auth: "active",
      aiProvider: "ready",
    },
  });
}
