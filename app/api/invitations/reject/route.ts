// app/api/invites/decline/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const { token, reason } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required", success: false },
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await prisma.orgInvitation.findUnique({
      where: { token },
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
            slug: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found or already processed", success: false },
        { status: 404 }
      );
    }

    // Check if invitation can be declined
    if (invite.status !== InviteStatus.pending) {
      const statusMessage = 
        invite.status === InviteStatus.accepted ? "already accepted" :
        invite.status === InviteStatus.expired ? "expired" :
        invite.status === InviteStatus.revoked ? "revoked" : "invalid";
      
      return NextResponse.json(
        { 
          error: `Cannot decline this invitation as it has been ${statusMessage}`,
          status: invite.status,
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    if (invite.expiresAt < new Date()) {
      // Mark as expired if not already
      await prisma.orgInvitation.update({
        where: { id: invite.id },
        data: { status: InviteStatus.expired },
      });
      
      return NextResponse.json(
        { error: "This invitation has already expired", success: false },
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
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found", success: false },
        { status: 404 }
      );
    }

    // Verify email matches the invitation
    const userEmail = user.email?.toLowerCase();
    const inviteEmail = invite.email.toLowerCase();

    if (userEmail !== inviteEmail) {
      return NextResponse.json(
        { 
          error: "This invitation was sent to a different email address",
          invitedEmail: invite.email,
          yourEmail: user.email,
          success: false,
        },
        { status: 403 }
      );
    }

    // Decline/revoke the invitation
    const updatedInvite = await prisma.orgInvitation.update({
      where: { token },
      data: {
        status: InviteStatus.revoked,
        // Optionally store the decline reason
        message: reason ? `Declined: ${reason}` : invite.message,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "invitation.declined",
        entityType: "org_invitation",
        entityId: invite.id,
        entityLabel: user.email,
        afterState: {
          status: InviteStatus.revoked,
          reason: reason || "User declined invitation",
        },
        severity: "info",
      },
    });

    // Notify the inviter that their invitation was declined
    await prisma.notification.create({
      data: {
        userId: invite.invitedBy,
        organizationId: invite.organizationId,
        type: "invitation_declined",
        category: "social",
        title: "Invitation Declined",
        body: `${user.fullName} declined your invitation to join ${invite.organization.name}${reason ? `: ${reason}` : ''}`,
        payload: {
          invitationId: invite.id,
          userId: user.id,
          userName: user.fullName,
          reason: reason || null,
        },
        actionUrl: `/dashboard/invites`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation declined successfully",
      invitation: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        status: updatedInvite.status,
        organization: {
          name: invite.organization.name,
          slug: invite.organization.slug,
        },
      },
    });
  } catch (error: any) {
    console.error("Decline invitation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to decline invitation",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        success: false,
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check invitation status before declining
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await prisma.orgInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
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
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is the intended recipient
    const isRecipient = user.email?.toLowerCase() === invite.email.toLowerCase();

    if (!isRecipient) {
      return NextResponse.json(
        { error: "You are not the intended recipient of this invitation" },
        { status: 403 }
      );
    }

    // Check invitation status
    let canDecline = false;
    let statusMessage = "";

    if (invite.status === InviteStatus.pending && invite.expiresAt > new Date()) {
      canDecline = true;
      statusMessage = "pending";
    } else if (invite.status === InviteStatus.accepted) {
      statusMessage = "already accepted";
    } else if (invite.status === InviteStatus.expired || invite.expiresAt < new Date()) {
      statusMessage = "expired";
    } else if (invite.status === InviteStatus.revoked) {
      statusMessage = "revoked";
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invite.id,
        organizationName: invite.organization.name,
        roleName: invite.role?.name || null,
        status: invite.status,
        expiresAt: invite.expiresAt,
        canDecline,
        statusMessage,
      },
    });
  } catch (error: any) {
    console.error("Check invitation error:", error);
    return NextResponse.json(
      { error: "Failed to check invitation status" },
      { status: 500 }
    );
  }
}