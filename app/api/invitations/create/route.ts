// app/api/invites/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      roleId,
      email,
      userType,
      message,
      expiresInDays = 7,
    } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate expiresInDays
    if (expiresInDays < 1 || expiresInDays > 30) {
      return NextResponse.json(
        { error: "Expiration days must be between 1 and 30" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get inviter profile
    const inviterProfile = await prisma.user.findFirst({
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
        userType: true,
      },
    });

    if (!inviterProfile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Get inviter's role in the organization
    const inviterMember = await prisma.userRole.findFirst({
      where: {
        organizationId,
        userId: inviterProfile.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    });

    // Check if inviter is a member
    if (!inviterMember) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Check if organization exists and is active
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        planTier: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!organization.isActive) {
      return NextResponse.json(
        { error: "Organization is inactive. Cannot send invitations." },
        { status: 403 }
      );
    }

    // Get target role
    const targetRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDefault: true,
      },
    });

    if (!targetRole) {
      return NextResponse.json(
        { error: "Invalid role for this organization" },
        { status: 400 }
      );
    }

    // Define role hierarchy and permissions
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    const inviterRoleName = inviterMember.role.name.toLowerCase();
    const targetRoleName = targetRole.name.toLowerCase();

    // Check if inviter can invite this role
    const canInvite = roleHierarchy[inviterRoleName]?.includes(targetRoleName) || false;
    
    // Super admin can invite anyone
    const isSuperAdmin = inviterProfile.userType === UserType.super_admin;
    
    if (!canInvite && !isSuperAdmin) {
      return NextResponse.json(
        { 
          error: `You cannot invite users with the role "${targetRole.name}". You can only invite: ${roleHierarchy[inviterRoleName]?.join(", ") || "none"}`,
        },
        { status: 403 }
      );
    }

    // Determine user type from role if not provided
    let determinedUserType = userType;
    if (!determinedUserType) {
      if (targetRoleName === "student") {
        determinedUserType = "student";
      } else if (targetRoleName === "alumni") {
        determinedUserType = "alumni";
      } else {
        determinedUserType = "alumni"; // Default for admin/moderator roles
      }
    }

    // Validate user type
    if (!["alumni", "student"].includes(determinedUserType)) {
      return NextResponse.json(
        { error: "Invalid user type. Must be 'alumni' or 'student'" },
        { status: 400 }
      );
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        emailNormalized: normalizedEmail,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User already exists in this organization",
          userName: existingUser.fullName,
          userStatus: existingUser.status,
        },
        { status: 409 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await prisma.orgInvitation.findFirst({
      where: {
        organizationId,
        email: normalizedEmail,
        status: InviteStatus.pending,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        expiresAt: true,
        role: {
          select: { name: true },
        },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { 
          error: "A pending invitation already exists for this email",
          existingRole: existingInvite.role?.name,
          expiresAt: existingInvite.expiresAt,
        },
        { status: 409 }
      );
    }

    // Check organization capacity
    const memberCount = await prisma.userRole.count({
      where: {
        organizationId,
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

    const maxMembers = planLimits[organization.planTier] || 100;
    
    if (memberCount >= maxMembers) {
      return NextResponse.json(
        { 
          error: "Organization has reached its member limit",
          currentMembers: memberCount,
          maxMembers,
          plan: organization.planTier,
        },
        { status: 403 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create invitation within transaction
    const invitation = await prisma.$transaction(async (tx) => {
      const invite = await tx.orgInvitation.create({
        data: {
          organizationId,
          invitedBy: inviterProfile.id,
          roleId: targetRole.id,
          userType: determinedUserType as any,
          email: normalizedEmail,
          token,
          message: message || null,
          status: InviteStatus.pending,
          expiresAt,
        },
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
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: inviterProfile.id,
          action: "invitation.created",
          entityType: "org_invitation",
          entityId: invite.id,
          entityLabel: normalizedEmail,
          afterState: {
            roleId: targetRole.id,
            roleName: targetRole.name,
            userType: determinedUserType,
            expiresAt,
            expiresInDays,
          },
          severity: "info",
        },
      });

      // Create notification for organization admins (optional)
      const admins = await tx.userRole.findMany({
        where: {
          organizationId,
          role: {
            slug: { in: ["admin", "super-admin"] },
          },
          userId: { not: inviterProfile.id },
        },
        select: { userId: true },
      });

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.userId,
            organizationId,
            type: "invitation_sent",
            category: "system",
            title: "New Invitation Sent",
            body: `${inviterProfile.fullName} invited ${normalizedEmail} to join as ${targetRole.name}`,
            payload: {
              invitationId: invite.id,
              invitedBy: inviterProfile.id,
              invitedEmail: normalizedEmail,
              role: targetRole.name,
            },
            actionUrl: `/dashboard/invites`,
          },
        });
      }

      return invite;
    });

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.alumniconnect.com";
    const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

    // Prepare email data
    const emailData = {
      to: normalizedEmail,
      inviterName: inviterProfile.fullName,
      inviterEmail: inviterProfile.email,
      organizationName: organization.name,
      organizationLogo: invitation.organization.logoUrl,
      roleName: targetRole.name,
      roleDescription: targetRole.description,
      customMessage: message,
      inviteUrl,
      expiresInDays,
      token,
    };

    // Attempt to send email
    let emailSent = false;
    let emailError = null;

    try {
      // Use your email service (SendGrid, Resend, Postmark, etc.)
      // This is a placeholder - implement with your actual email service
      
      // Example with Resend:
      // await resend.emails.send({
      //   from: "noreply@alumniconnect.com",
      //   to: normalizedEmail,
      //   subject: `Invitation to join ${organization.name}`,
      //   react: InvitationEmailTemplate(emailData),
      // });
      
      console.log("Email would be sent to:", normalizedEmail);
      console.log("Invite URL:", inviteUrl);
      console.log("Email data:", emailData);
      
      emailSent = true;
    } catch (error) {
      console.error("Failed to send email:", error);
      emailError = error;
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Invitation created and sent successfully" 
        : "Invitation created but email delivery failed. Please check email settings.",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        role: invitation.role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          slug: invitation.organization.slug,
        },
      },
      emailSent,
      emailError: emailError ? "Email delivery failed" : undefined,
      // Only include inviteUrl in development
      ...(process.env.NODE_ENV === "development" && { inviteUrl }),
    });
  } catch (error: any) {
    console.error("Create invitation error:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An invitation with this token already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create invitation",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to get available roles for invitation (GET endpoint)
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
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
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's role in the organization
    const userRole = await prisma.userRole.findFirst({
      where: {
        organizationId,
        userId: user.id,
        revokedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!userRole && user.userType !== UserType.super_admin) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Define role hierarchy for invitation permissions
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    const userRoleName = userRole?.role.name.toLowerCase() || "super_admin";
    const allowedRoleSlugs = roleHierarchy[userRoleName] || [];

    // Get available roles for invitation
    const availableRoles = await prisma.role.findMany({
      where: {
        organizationId,
        slug: { in: allowedRoleSlugs },
        isSystem: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDefault: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      roles: availableRoles,
      canInvite: allowedRoleSlugs.length > 0,
    });
  } catch (error: any) {
    console.error("Get available roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available roles" },
      { status: 500 }
    );
  }
}