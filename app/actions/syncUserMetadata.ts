"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Fetches the user's role from our DB and writes it into Clerk publicMetadata.
 * Called once from the router page when publicMetadata.userType is missing.
 * Returns the userType so the router can redirect without a second round-trip.
 */
export async function syncUserMetadataAction(intent?: string): Promise<{
  userType: string;
  hasOrganization: boolean;
}> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  // Fetch user from our database
  const user = await prisma.user.findFirst({
    where: {
      metadata: { path: ["clerkId"], equals: clerkId },
    },
    select: {
      userType: true,
      organizationId: true,
    },
  });

  let userType = (user?.userType ?? "alumni") as string;
  const hasOrganization = !!user?.organizationId;

  // Force super_admin if signup came from org-setup intent
  if (intent === "org_setup" && userType !== "super_admin") {
    userType = "super_admin";
    // Also update the DB record
    if (user) {
      await prisma.user.updateMany({
        where: { metadata: { path: ["clerkId"], equals: clerkId } },
        data: { userType: "super_admin" as any },
      });
    }
  }

  // Write into Clerk publicMetadata so future loads are instant
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    await clerk.users.updateUser(clerkId, {
      publicMetadata: {
        ...(clerkUser.publicMetadata || {}),
        userType,
        hasOrganization,
      },
    });
  } catch (e) {
    console.error("Failed to update Clerk publicMetadata:", e);
    // Non-fatal — we still return the correct userType
  }

  return { userType, hasOrganization };
}
