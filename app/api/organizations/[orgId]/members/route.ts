// app/api/organizations/[orgId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ALL MEMBERS OF AN ORGANIZATION */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("userType") || "all";
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        organizationId: true,
        userType: true,
        userRoles: {
          where: {
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const isOrgMember = currentUser.organizationId === orgId || currentUser.userRoles.length > 0;

    if (!isSuperAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: "Access denied: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause: any = {
      organizationId: orgId,
      deletedAt: null,
      status: "active",
    };

    // Filter by user type
    if (userType !== "all") {
      whereClause.userType = userType as UserType;
    }

    // Search by name or email
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case "name":
        orderBy = { fullName: sortOrder };
        break;
      case "joined":
        orderBy = { createdAt: sortOrder };
        break;
      case "lastSeen":
        orderBy = { lastSeenAt: sortOrder };
        break;
      case "role":
        orderBy = { userRoles: { role: { priority: sortOrder === "asc" ? "desc" : "asc" } } };
        break;
      default:
        orderBy = { fullName: "asc" };
    }

    // Fetch members with pagination
    const [members, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          alumniProfile: {
            include: {
              workHistory: {
                orderBy: { startedAt: "desc" },
                take: 1,
              },
            },
          },
          studentProfile: true,
          userRoles: {
            where: {
              organizationId: orgId,
              revokedAt: null,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
            include: {
              role: true,
            },
          },
          _count: {
            select: {
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get user's connections for connection status
    const connections = await prisma.connection.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { requesterId: currentUser.id },
          { recipientId: currentUser.id },
        ],
      },
      select: {
        requesterId: true,
        recipientId: true,
        status: true,
      },
    });

    const connectedUserIds = new Set<string>();
    const pendingSentUserIds = new Set<string>();
    const pendingReceivedUserIds = new Set<string>();

    connections.forEach(conn => {
      if (conn.status === ConnectionStatus.accepted) {
        if (conn.requesterId === currentUser.id) {
          connectedUserIds.add(conn.recipientId);
        } else {
          connectedUserIds.add(conn.requesterId);
        }
      } else if (conn.status === ConnectionStatus.pending) {
        if (conn.requesterId === currentUser.id) {
          pendingSentUserIds.add(conn.recipientId);
        } else {
          pendingReceivedUserIds.add(conn.requesterId);
        }
      }
    });

    // Format members data
    const formattedMembers = members.map(member => {
      const profile = member.alumniProfile || member.studentProfile;
      const memberRole = member.userRoles[0]?.role;
      const isConnected = connectedUserIds.has(member.id);
      const isPendingSent = pendingSentUserIds.has(member.id);
      const isPendingReceived = pendingReceivedUserIds.has(member.id);

      return {
        id: member.id,
        name: member.fullName,
        firstName: member.firstName,
        email: member.email,
        avatar: member.avatarUrl,
        userType: member.userType,
        role: memberRole ? {
          id: memberRole.id,
          name: memberRole.name,
          slug: memberRole.slug,
          priority: memberRole.priority,
        } : null,
        headline: profile?.headline || null,
        location: profile?.city || null,
        
        // Alumni specific
        graduationYear: member.alumniProfile?.graduationYear,
        currentCompany: member.alumniProfile?.currentCompany,
        currentTitle: member.alumniProfile?.currentTitle,
        industry: member.alumniProfile?.industry,
        isOpenToWork: member.alumniProfile?.isOpenToWork,
        isMentorAvailable: member.alumniProfile?.isMentorAvailable,
        
        // Student specific
        expectedGraduation: member.studentProfile?.expectedGraduation,
        major: member.studentProfile?.major,
        isSeekingMentorship: member.studentProfile?.isSeekingMentorship,
        isSeekingInternship: member.studentProfile?.isSeekingInternship,
        isSeekingFulltime: member.studentProfile?.isSeekingFulltime,
        
        // Skills (ProfileSkill is not a direct profile relation here)
        skills: [],
        
        // Connection status
        connectionStatus: isConnected ? "connected" : (isPendingSent ? "pending_sent" : (isPendingReceived ? "pending_received" : "not_connected")),
        
        // Activity
        lastSeenAt: member.lastSeenAt,
        joinedAt: member.createdAt,
        isOnline: member.lastSeenAt 
          ? new Date(member.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000
          : false,
      };
    });

    // Get organization statistics
    const stats = await getOrganizationStats(orgId);

    // Get role distribution
    const roleDistribution = await prisma.userRole.groupBy({
      by: ["roleId"],
      where: {
        organizationId: orgId,
        revokedAt: null,
      },
      _count: true,
    });

    const rolesWithNames = await Promise.all(
      roleDistribution.map(async (rd) => {
        const role = await prisma.role.findUnique({
          where: { id: rd.roleId },
          select: { name: true, slug: true },
        });
        return {
          roleId: rd.roleId,
          roleName: role?.name || "Unknown",
          roleSlug: role?.slug,
          count: rd._count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      stats,
      roleDistribution: rolesWithNames,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error("Members GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE MEMBER ROLE (Admin/Super Admin only) */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await req.json();
    const { memberId, roleId, expiresAt } = body;

    if (!memberId || !roleId) {
      return NextResponse.json(
        { error: "Member ID and Role ID are required" },
        { status: 400 }
      );
    }

    // Get current user and check permissions
    const currentUser = await prisma.user.findFirst({
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
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const currentUserRole = currentUser.userRoles[0]?.role;
    const canManageRoles = isSuperAdmin || (currentUserRole && (currentUserRole.slug === "admin" || currentUserRole.slug === "super-admin"));

    if (!canManageRoles) {
      return NextResponse.json(
        { error: "You don't have permission to manage member roles" },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await prisma.user.findFirst({
      where: {
        id: memberId,
        organizationId: orgId,
      },
      include: {
        userRoles: {
          where: {
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get target role
    const targetRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: orgId,
      },
    });

    if (!targetRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent modifying super admin role
    if (targetRole.slug === "super-admin" && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin role cannot be modified" },
        { status: 403 }
      );
    }

    // Update role assignment
    const existingRole = targetMember.userRoles[0];
    
    if (existingRole) {
      // Update existing role
      await prisma.userRole.update({
        where: { id: existingRole.id },
        data: {
          roleId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          grantedBy: currentUser.id,
          grantedReason: "Role updated by admin",
        },
      });
    } else {
      // Create new role assignment
      await prisma.userRole.create({
        data: {
          userId: memberId,
          roleId,
          organizationId: orgId,
          grantedBy: currentUser.id,
          grantedReason: "Role assigned by admin",
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: currentUser.id,
        action: "member.role_updated",
        entityType: "user",
        entityId: memberId,
        entityLabel: targetMember.fullName,
        afterState: {
          oldRole: existingRole?.role.name,
          newRole: targetRole.name,
        },
        severity: "info",
      },
    });

    // Create notification for member
    await prisma.notification.create({
      data: {
        userId: memberId,
        organizationId: orgId,
        type: "role_updated",
        category: "system",
        title: "Your Role Has Been Updated",
        body: `Your role in the organization has been changed to ${targetRole.name}`,
        payload: {
          newRole: targetRole.name,
          oldRole: existingRole?.role.name,
        },
        actionUrl: `/dashboard/profile`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully",
    });
  } catch (err: any) {
    console.error("Member role update failed:", err);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

/* ✅ REMOVE MEMBER FROM ORGANIZATION (Admin/Super Admin only) */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get current user and check permissions
    const currentUser = await prisma.user.findFirst({
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
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const currentUserRole = currentUser.userRoles[0]?.role;
    const canRemoveMembers = isSuperAdmin || (currentUserRole && (currentUserRole.slug === "admin" || currentUserRole.slug === "super-admin"));

    if (!canRemoveMembers) {
      return NextResponse.json(
        { error: "You don't have permission to remove members" },
        { status: 403 }
      );
    }

    // Cannot remove self
    if (memberId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Get target member
    const targetMember = await prisma.user.findFirst({
      where: {
        id: memberId,
        organizationId: orgId,
      },
      include: {
        userRoles: {
          where: {
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Prevent removing super admin
    const isTargetSuperAdmin = targetMember.userRoles.some(ur => ur.role.slug === "super-admin");
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot remove super admin from organization" },
        { status: 403 }
      );
    }

    // Remove member by revoking all roles and disassociating organization
    await prisma.$transaction(async (tx) => {
      // Revoke all roles
      await tx.userRole.updateMany({
        where: {
          userId: memberId,
          organizationId: orgId,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "Removed from organization by admin",
        },
      });

      // Update user's organization association
      await tx.user.update({
        where: { id: memberId },
        data: {
          // organizationId is required by schema; do not null it.
          status: "pending",
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId: currentUser.id,
          action: "member.removed",
          entityType: "user",
          entityId: memberId,
          entityLabel: targetMember.fullName,
          severity: "warning",
        },
      });

      // Create notification for removed member
      await tx.notification.create({
        data: {
          userId: memberId,
          organizationId: orgId,
          type: "member_removed",
          category: "system",
          title: "Organization Membership Removed",
          body: `You have been removed from the organization`,
          payload: {
            organizationId: orgId,
            removedBy: currentUser.id,
          },
          actionUrl: `/`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from organization successfully",
    });
  } catch (err: any) {
    console.error("Member removal failed:", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// Helper function to get organization statistics
async function getOrganizationStats(orgId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalMembers,
    activeMembers,
    newMembersLast30Days,
    alumniCount,
    studentCount,
    adminsCount,
  ] = await Promise.all([
    prisma.user.count({
      where: { organizationId: orgId, status: "active", deletedAt: null },
    }),
    prisma.user.count({
      where: {
        organizationId: orgId,
        lastSeenAt: { gte: thirtyDaysAgo },
        status: "active",
      },
    }),
    prisma.user.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.user.count({
      where: { organizationId: orgId, userType: UserType.alumni, status: "active" },
    }),
    prisma.user.count({
      where: { organizationId: orgId, userType: UserType.student, status: "active" },
    }),
    prisma.userRole.count({
      where: {
        organizationId: orgId,
        role: { slug: { in: ["admin", "super-admin"] } },
        revokedAt: null,
      },
    }),
  ]);

  return {
    total: totalMembers,
    active: activeMembers,
    newLast30Days: newMembersLast30Days,
    alumni: alumniCount,
    students: studentCount,
    admins: adminsCount,
    engagementRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
  };
}