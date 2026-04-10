// app/api/invites/accept/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, acceptTerms = true } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "You must accept the terms to join" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await prisma.orgInvitation.findUnique({
      where: { token },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
            isVerified: true,
            planTier: true,
            settings: true,
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

    // Validate invitation
    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    if (invite.status !== InviteStatus.pending) {
      const statusMessage = 
        invite.status === InviteStatus.accepted ? "already accepted" :
        invite.status === InviteStatus.expired ? "expired" :
        invite.status === InviteStatus.revoked ? "revoked" : "invalid";
      
      return NextResponse.json(
        { 
          error: `This invitation has been ${statusMessage}`,
          status: invite.status,
        },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await prisma.orgInvitation.update({
        where: { id: invite.id },
        data: { status: InviteStatus.expired },
      });
      
      return NextResponse.json(
        { error: "This invitation has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user by Clerk ID
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      include: {
        alumniProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Verify email matches
    const userEmail = user.email?.toLowerCase();
    const inviteEmail = invite.email.toLowerCase();

    if (userEmail !== inviteEmail) {
      return NextResponse.json(
        { 
          error: "This invitation was sent to a different email address",
          invitedEmail: invite.email,
          yourEmail: user.email,
        },
        { status: 403 }
      );
    }

    // Check if user already belongs to this organization
    const existingMembership = await prisma.userRole.findFirst({
      where: {
        organizationId: invite.organizationId,
        userId: user.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { 
          error: "You are already a member of this organization",
          organizationName: invite.organization.name,
        },
        { status: 409 }
      );
    }

    // Check if organization is active
    if (!invite.organization.isActive) {
      return NextResponse.json(
        { error: "This organization is currently inactive. Please contact support." },
        { status: 403 }
      );
    }

    // Check organization capacity based on plan
    const memberCount = await prisma.userRole.count({
      where: {
        organizationId: invite.organizationId,
        revokedAt: null,
      },
    });

    const planLimits: Record<string, number> = {
      free: 100,
      starter: 500,
      pro: 2000,
      enterprise: 10000,
      custom: 100000,
    };

    const maxMembers = planLimits[invite.organization.planTier] || 100;
    if (memberCount >= maxMembers) {
      return NextResponse.json(
        { error: "This organization has reached its member limit. Please contact the organization admin." },
        { status: 403 }
      );
    }

    // Use transaction for all updates
    const result = await prisma.$transaction(async (tx) => {
      // Update user's organization and type
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: invite.organizationId,
          userType: invite.userType,
          status: UserStatus.active,
          metadata: {
            ...(user.metadata as any || {}),
            acceptedInviteAt: new Date().toISOString(),
            invitedBy: invite.invitedBy,
          },
        },
      });

      // Create user role
      const userRole = await tx.userRole.create({
        data: {
          organizationId: invite.organizationId,
          userId: user.id,
          roleId: invite.roleId!,
          grantedBy: invite.invitedBy || "system",
          grantedReason: "Accepted organization invitation",
        },
        include: {
          role: true,
        },
      });

      // Create or update profile based on user type
      if (invite.userType === UserType.alumni) {
        await tx.alumniProfile.upsert({
          where: { userId: user.id },
          update: {
            organizationId: invite.organizationId,
          },
          create: {
            userId: user.id,
            organizationId: invite.organizationId,
          },
        });
      } else if (invite.userType === UserType.student) {
        await tx.studentProfile.upsert({
          where: { userId: user.id },
          update: {
            organizationId: invite.organizationId,
          },
          create: {
            userId: user.id,
            organizationId: invite.organizationId,
          },
        });
      }

      // Mark invitation as accepted
      const acceptedInvite = await tx.orgInvitation.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.accepted,
          acceptedAt: new Date(),
        },
      });

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          organizationId: invite.organizationId,
          type: "welcome",
          category: "system",
          title: `Welcome to ${invite.organization.name}!`,
          body: `You've successfully joined ${invite.organization.name} as a ${invite.role?.name || "Member"}. Complete your profile to get started.`,
          payload: {
            organizationId: invite.organizationId,
            role: invite.role?.name || "Member",
          },
          actionUrl: "/dashboard/profile/edit",
        },
      });

      // Notify the inviter that their invite was accepted
      await tx.notification.create({
        data: {
          userId: invite.invitedBy,
          organizationId: invite.organizationId,
          type: "invitation_accepted",
          category: "social",
          title: "Invitation Accepted",
          body: `${user.fullName} has accepted your invitation to join ${invite.organization.name}`,
          payload: {
            userId: user.id,
            userName: user.fullName,
            invitationId: invite.id,
          },
          actionUrl: `/dashboard/profile/${user.id}`,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: invite.organizationId,
          actorId: user.id,
          action: "invitation.accepted",
          entityType: "org_invitation",
          entityId: invite.id,
          entityLabel: user.email,
          afterState: {
            status: InviteStatus.accepted,
            userType: invite.userType,
            roleId: invite.roleId,
          },
          severity: "info",
        },
      });

      return { updatedUser, userRole, acceptedInvite };
    });

    // Generate member code for the user (for display purposes)
    const memberCode = `${invite.organization.slug.substring(0, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return NextResponse.json({
      success: true,
      message: "Successfully joined the organization!",
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
        logoUrl: invite.organization.logoUrl,
      },
      role: invite.role
        ? {
            id: invite.role.id,
            name: invite.role.name,
            slug: invite.role.slug,
          }
        : null,
      user: {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        fullName: result.updatedUser.fullName,
        userType: result.updatedUser.userType,
      },
      memberCode,
      needsProfileCompletion: !user.alumniProfile && !user.studentProfile,
      nextSteps: {
        completeProfile: "/dashboard/profile/edit",
        exploreNetwork: "/dashboard/network",
        viewOrganization: `/organization/${invite.organization.slug}`,
      },
    });
  } catch (error: any) {
    console.error("Accept invitation error:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to accept invitation",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}