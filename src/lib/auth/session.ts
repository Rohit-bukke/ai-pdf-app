import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import { UnauthorizedError, ForbiddenError } from "../errors";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "USER" | "ADMIN";
}

/**
 * Retrieves the current session safely on the server side.
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Enforces that the request has an active authenticated session.
 * Throws UnauthorizedError (401) if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new UnauthorizedError("You must be signed in to perform this action.");
  }
  return session.user;
}

/**
 * Enforces that the authenticated user has the ADMIN role.
 * Throws ForbiddenError (403) if not an admin.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Administrative privileges required for this operation.");
  }
  return user;
}

/**
 * Validates that a user-owned resource belongs to the currently authenticated user.
 */
export function verifyOwnership(resourceOwnerId: string | object, authenticatedUserId: string) {
  const ownerIdStr = resourceOwnerId.toString();
  if (ownerIdStr !== authenticatedUserId) {
    throw new ForbiddenError("Access denied: You do not own this resource.");
  }
}
