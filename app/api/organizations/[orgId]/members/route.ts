// app/api/organizations/[orgId]/members/route.ts
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
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Get all members
    const members = await prisma.organization_members.findMany({
      where: { organization_id: params.orgId },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            user_type: true,
            graduation_year: true,
            degree: true,
          },
        },
        organization_roles: {
          select: {
            id: true,
            name: true,
            display_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error("Members GET failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

