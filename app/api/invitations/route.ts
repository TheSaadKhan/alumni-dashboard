// app/api/invites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import { randomBytes } from "crypto";

import { sendInviteEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ALL INVITES FOR ORGANIZATION */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status"); // pending, accepted, expired, revoked, all
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
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
        userRoles: {
          where: {
            organizationId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to view invites (admin or super admin)
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view invites" },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause: any = { organizationId };
    
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Fetch invites with pagination
    const [invites, totalCount] = await Promise.all([
      prisma.orgInvitation.findMany({
        where: whereClause,
        include: {
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.orgInvitation.count({ where: whereClause }),
    ]);

    // Enhance invites with computed fields
    const enhancedInvites = invites.map(invite => ({
      ...invite,
      isExpired: invite.status === InviteStatus.expired || 
        (invite.status === InviteStatus.pending && new Date(invite.expiresAt) < new Date()),
      expiresInDays: Math.max(0, Math.ceil(
        (new Date(invite.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )),
      canResend: invite.status === InviteStatus.pending && 
        new Date(invite.expiresAt) > new Date(),
    }));

    // Get statistics
    const stats = {
      total: totalCount,
      pending: await prisma.orgInvitation.count({
        where: { 
          organizationId, 
          status: InviteStatus.pending,
          expiresAt: { gt: new Date() },
        },
      }),
      accepted: await prisma.orgInvitation.count({
        where: { organizationId, status: InviteStatus.accepted },
      }),
      expired: await prisma.orgInvitation.count({
        where: { 
          organizationId, 
          OR: [
            { status: InviteStatus.expired },
            { 
              status: InviteStatus.pending,
              expiresAt: { lt: new Date() },
            },
          ],
        },
      }),
      revoked: await prisma.orgInvitation.count({
        where: { organizationId, status: InviteStatus.revoked },
      }),
    };

    return NextResponse.json({
      success: true,
      invites: enhancedInvites,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch invites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ CREATE NEW INVITE */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      email,
      roleId,
      userType,
      customMessage,
      expiresInDays = 7,
    } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ error: "Role ID required" }, { status: 400 });
    }

    if (!userType || !["alumni", "student", "admin"].includes(userType)) {
      return NextResponse.json({ error: "Valid user type required (alumni, student, or admin)" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
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
        userType: true,
        userRoles: {
          where: {
            organizationId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission to send invites
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to send invites" },
        { status: 403 }
      );
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        emailNormalized: email.toLowerCase(),
        organizationId,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists in this organization" },
        { status: 400 }
      );
    }

    // Check for existing pending invite - if found, revoke it to allow re-inviting
    await prisma.orgInvitation.updateMany({
      where: {
        email: email.toLowerCase(),
        organizationId,
        status: InviteStatus.pending,
      },
      data: {
        status: InviteStatus.revoked,
      }
    });

    // Verify role belongs to organization
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found in this organization" },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create invitation
    const invitation = await prisma.orgInvitation.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        roleId,
        userType: userType as any,
        invitedBy: user.id,
        token,
        message: customMessage || null,
        status: InviteStatus.pending,
        expiresAt,
      },
      include: {
        organization: {
          select: {
            name: true,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: user.id,
        action: "invitation.created",
        entityType: "org_invitation",
        entityId: invitation.id,
        entityLabel: email,
        afterState: {
          roleId,
          userType,
          expiresAt,
        },
        severity: "info",
      },
    });

    // Send email notification
    try {
      await sendInviteEmail(
        email.toLowerCase(),
        token,
        (invitation as any).organization.name
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // We don't fail the whole request if email fails, 
      // as the invite is already in the database
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        role: invitation.role,
        invitedBy: invitation.invitedByUser,
        createdAt: invitation.createdAt,
      },
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${token}`,
    });
  } catch (error: any) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation", details: error.message },
      { status: 500 }
    );
  }
}