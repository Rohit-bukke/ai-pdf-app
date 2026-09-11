import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPlatformAnalytics } from "@/lib/services/analytics-service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    // 1. Enforce Admin Authorization
    await requireAdmin();

    const analytics = await getAdminPlatformAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
