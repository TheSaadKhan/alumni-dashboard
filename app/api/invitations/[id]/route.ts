// app/api/invites/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/* ✅ GET INVITE DETAILS */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Get current user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get invite details
    const invite = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check permission to view invite
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isInviter = invite.invitedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isInviter) {
      return NextResponse.json(
        { error: "You don't have permission to view this invitation" },
        { status: 403 }
      );
    }

    // Enhance invite with computed fields
    const enhancedInvite = {
      ...invite,
      isExpired: invite.status === InviteStatus.expired || 
        (invite.status === InviteStatus.pending && new Date(invite.expiresAt) < new Date()),
      expiresInDays: Math.max(0, Math.ceil(
        (new Date(invite.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )),
      canResend: invite.status === InviteStatus.pending && 
        new Date(invite.expiresAt) > new Date(),
      canRevoke: invite.status === InviteStatus.pending,
    };

    return NextResponse.json({
      success: true,
      invite: enhancedInvite,
    });
  } catch (error: any) {
    console.error("Get invite error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ DELETE/REVOKE INVITE */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Revoked by administrator";

    // Get current user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get invite details
    const invite = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invite can be revoked
    if (invite.status !== InviteStatus.pending) {
      return NextResponse.json(
        { error: `Cannot revoke invitation with status: ${invite.status}` },
        { status: 400 }
      );
    }

    // Check permission to revoke
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isInviter = invite.invitedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isInviter) {
      return NextResponse.json(
        { error: "You don't have permission to revoke this invitation" },
        { status: 403 }
      );
    }

    // Revoke the invitation
    const revokedInvite = await prisma.orgInvitation.update({
      where: { id },
      data: {
        status: InviteStatus.revoked,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "invitation.revoked",
        entityType: "org_invitation",
        entityId: id,
        entityLabel: invite.email,
        afterState: {
          status: InviteStatus.revoked,
          reason,
        },
        severity: "warning",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
      invitation: {
        id: revokedInvite.id,
        email: revokedInvite.email,
        status: revokedInvite.status,
      },
    });
  } catch (error: any) {
    console.error("Delete invite error:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE INVITE (Change Role) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: "Missing roleId parameter" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get invite details
    const invite = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invite can be updated (only pending invites)
    if (invite.status !== InviteStatus.pending) {
      return NextResponse.json(
        { error: `Cannot update invitation with status: ${invite.status}` },
        { status: 400 }
      );
    }

    // Check permission to update
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this invitation" },
        { status: 403 }
      );
    }

    // Verify new role belongs to organization
    const newRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: invite.organizationId,
      },
    });

    if (!newRole) {
      return NextResponse.json(
        { error: "Role not found in this organization" },
        { status: 404 }
      );
    }

    // Update invitation with new role
    const updatedInvite = await prisma.orgInvitation.update({
      where: { id },
      data: {
        roleId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "invitation.updated",
        entityType: "org_invitation",
        entityId: id,
        entityLabel: invite.email,
        afterState: {
          oldRoleId: invite.roleId,
          newRoleId: roleId,
        },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation updated successfully",
      invitation: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        role: updatedInvite.role,
        status: updatedInvite.status,
      },
    });
  } catch (error: any) {
    console.error("Update invite error:", error);
    return NextResponse.json(
      { error: "Failed to update invitation", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ RESEND INVITE */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Get current user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get invite details
    const invite = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invite can be resent
    if (invite.status !== InviteStatus.pending) {
      return NextResponse.json(
        { error: `Cannot resend invitation with status: ${invite.status}` },
        { status: 400 }
      );
    }

    // Check permission to resend
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isInviter = invite.invitedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isInviter) {
      return NextResponse.json(
        { error: "You don't have permission to resend this invitation" },
        { status: 403 }
      );
    }

    // Generate new token and extend expiration
    const newToken = randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updatedInvite = await prisma.orgInvitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: InviteStatus.pending,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "invitation.resend",
        entityType: "org_invitation",
        entityId: id,
        entityLabel: invite.email,
        afterState: {
          newExpiresAt: newExpiresAt,
        },
        severity: "info",
      },
    });

    // Generate new invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${newToken}`;

    // TODO: Resend email notification
    // await sendEmail({
    //   to: invite.email,
    //   subject: `Reminder: Invitation to join ${invite.organization.name}`,
    //   template: "invitation_resend",
    //   data: {
    //     inviterName: user.fullName,
    //     organizationName: invite.organization.name,
    //     roleName: invite.role.name,
    //     inviteUrl,
    //     expiresInDays: 7,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
      invitation: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        expiresAt: updatedInvite.expiresAt,
      },
      inviteUrl, // For testing/development
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation", details: error.message },
      { status: 500 }
    );
  }
}