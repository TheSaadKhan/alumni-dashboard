// app/api/invitations/info/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with roles
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
        userType: true,
        status: true,
        organizationId: true,
        userRoles: {
          where: {
            revokedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                priority: true,
                isSystem: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isActive: true,
                planTier: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get active membership (primary organization)
    let activeMembership = user.userRoles[0];
    let organizationId = user.organizationId;

    // If user has multiple roles, prioritize the one with highest priority
    if (user.userRoles.length > 1) {
      activeMembership = user.userRoles.reduce((highest, current) => 
        (current.role.priority > highest.role.priority) ? current : highest
      );
    }

    // If no organization ID from user, use from membership
    if (!organizationId && activeMembership) {
      organizationId = activeMembership.organizationId;
    }

    if (!organizationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No organization associated with user",
          needsOnboarding: true,
        },
        { status: 403 }
      );
    }

    // Check if user is super admin globally
    const isSuperAdmin = user.userType === UserType.super_admin;

    // Define role hierarchy for invitation permissions
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    // Get user's role name for permission checking
    const userRoleName = activeMembership?.role.slug || "member";
    const allowedRoleSlugs = isSuperAdmin 
      ? ["admin", "moderator", "alumni", "student"]
      : roleHierarchy[userRoleName] || [];

    // Get allowed roles for invitation
    const allowedRoles = await prisma.role.findMany({
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
        priority: true,
        isDefault: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    // Get all pending invites
    const pendingInvites = await prisma.orgInvitation.findMany({
      where: {
        organizationId,
        status: InviteStatus.pending,
        expiresAt: { gt: new Date() },
      },
      include: {
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
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get accepted invites (for history)
    const acceptedInvites = await prisma.orgInvitation.findMany({
      where: {
        organizationId,
        status: InviteStatus.accepted,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { acceptedAt: "desc" },
      take: 10,
    });

    // Get expired/revoked invites
    const expiredInvites = await prisma.orgInvitation.findMany({
      where: {
        organizationId,
        OR: [
          { status: InviteStatus.expired },
          { status: InviteStatus.revoked },
          {
            status: InviteStatus.pending,
            expiresAt: { lt: new Date() },
          },
        ],
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expiresAt: "desc" },
      take: 10,
    });

    // Get organization stats
    const organizationStats = await prisma.$transaction(async (tx) => {
      const [
        totalMembers,
        activeMembers,
        totalInvitesSent,
      ] = await Promise.all([
        tx.userRole.count({
          where: {
            organizationId,
            revokedAt: null,
          },
        }),
        tx.user.count({
          where: {
            organizationId,
            status: "active",
            lastSeenAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        tx.orgInvitation.count({
          where: { organizationId },
        })
      ]);

      const org = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { planTier: true },
      });
      const planLimits: Record<string, number> = {
        free: 100,
        starter: 500,
        pro: 2000,
        enterprise: 10000,
        custom: 100000,
      };
      const maxMembers = planLimits[org?.planTier || "free"] || 100;
      const availableSlots = Math.max(0, maxMembers - totalMembers);

      return {
        totalMembers,
        activeMembers,
        totalInvitesSent,
        availableSlots,
        engagementRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      };
    });

    // Get user's invitation permissions
    const permissions = {
      canInvite: allowedRoleSlugs.length > 0,
      canRevoke: isSuperAdmin || ["admin", "super_admin"].includes(userRoleName),
      canResend: isSuperAdmin || ["admin", "super_admin"].includes(userRoleName),
      canViewAll: isSuperAdmin || ["admin", "super_admin"].includes(userRoleName),
      allowedRoles: allowedRoles.map(r => r.slug),
    };

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isActive: true,
        isVerified: true,
        planTier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organizationId,
        name: organization?.name,
        slug: organization?.slug,
        logoUrl: organization?.logoUrl,
        isActive: organization?.isActive,
        isVerified: organization?.isVerified,
        planTier: organization?.planTier,
      },
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        role: activeMembership?.role,
      },
      permissions,
      allowedRoles,
      pendingInvites: pendingInvites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        invitedBy: invite.invitedByUser,
        message: invite.message,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        expiresInDays: Math.max(0, Math.ceil(
          (new Date(invite.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )),
      })),
      inviteHistory: {
        accepted: acceptedInvites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          invitedBy: invite.invitedByUser?.fullName,
          acceptedAt: invite.acceptedAt,
        })),
        expired: expiredInvites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiredAt: invite.expiresAt,
        })),
      },
      stats: organizationStats,
      canInvite: permissions.canInvite,
    });
  } catch (err: any) {
    console.error("Invitations info API error:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch invitation data",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}