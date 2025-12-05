// app/api/organizations/[orgId]/roles/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify user is member of organization
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: params.orgId,
        user_id: profile.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Get all roles for this organization
    const roles = await prisma.organization_roles.findMany({
      where: { organization_id: params.orgId },
      orderBy: { hierarchy_level: "desc" },
    });

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error("Roles GET failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

