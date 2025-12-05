import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authUserId = url.searchParams.get("authUserId");

    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: "Missing authUserId" },
        { status: 400 }
      );
    }

    /* ----------------------------------------
       1️⃣ GET PROFILE
    ----------------------------------------- */
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: authUserId },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    /* ----------------------------------------
       2️⃣ GET ACTIVE MEMBERSHIP
    ----------------------------------------- */
    const membership = await prisma.organization_members.findFirst({
      where: {
        user_id: profile.id,
        membership_status: "active",
        is_active: true,
      },
      include: {
        organization_roles: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No active membership found" },
        { status: 403 }
      );
    }

    const orgId = membership.organization_id;

    /* ----------------------------------------
       3️⃣ Get allowed roles this role can invite
       organization_roles.can_invite_roles (JSON)
    ----------------------------------------- */
    const inviterRole = membership.organization_roles;

    let canInviteRoleIds: string[] = [];

    if (inviterRole.can_invite_roles) {
      const parsed =
        typeof inviterRole.can_invite_roles === "string"
          ? JSON.parse(inviterRole.can_invite_roles)
          : inviterRole.can_invite_roles;

      if (Array.isArray(parsed)) {
        canInviteRoleIds = parsed;
      }
    }

    // Fetch those roles
    const allowedRoles = await prisma.organization_roles.findMany({
      where: { id: { in: canInviteRoleIds } },
      select: {
        id: true,
        name: true,
        display_name: true,
      },
    });

    /* ----------------------------------------
       4️⃣ Pending Invitations for this org
    ----------------------------------------- */
    const pendingInvites = await prisma.organization_invitations.findMany({
      where: {
        organization_id: orgId,
        status: "pending",
      },
      include: {
        organization_roles: {
          select: {
            id: true,
            display_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      organizationId: orgId,
      allowedRoles,
      pendingInvites,
    });
  } catch (err) {
    console.error("API /invitations/info error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
