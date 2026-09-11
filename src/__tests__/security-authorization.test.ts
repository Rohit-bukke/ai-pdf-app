import { describe, it, expect } from "vitest";
import { verifyOwnership } from "../lib/auth/session";
import { ForbiddenError } from "../lib/errors";

describe("Security & Multi-Tenant Authorization Isolation", () => {
  const userA_Id = "66e123456789abcdef000001";
  const userB_Id = "66e123456789abcdef000002";

  it("permits access when authenticated user is the resource owner", () => {
    expect(() => {
      verifyOwnership(userA_Id, userA_Id);
    }).not.toThrow();
  });

  it("STRICT ISOLATION: Throws ForbiddenError when User B attempts to access User A's resource", () => {
    expect(() => {
      verifyOwnership(userA_Id, userB_Id);
    }).toThrow(ForbiddenError);
  });

  it("rejects non-matching object IDs safely", () => {
    const resourceOwnerObj = { toString: () => userA_Id };
    expect(() => {
      verifyOwnership(resourceOwnerObj, userB_Id);
    }).toThrow("Access denied: You do not own this resource.");
  });
});
