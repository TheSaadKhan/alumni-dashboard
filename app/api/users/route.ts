// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserStatus, UserType, InviteStatus } from "@/lib/generated/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ALL USERS (ADMIN) */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const search = searchParams.get("search") || "";
    const userType = searchParams.get("userType") || "all";
    const status = searchParams.get("status") || "all";
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

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
        organizationId: true,
        userRoles: {
          where: {
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
    const isOrgAdmin = currentUser.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view users" },
        { status: 403 }
      );
    }

    const targetOrgId = organizationId || currentUser.organizationId;

    if (!targetOrgId && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
    };

    if (targetOrgId) {
      whereClause.organizationId = targetOrgId;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (userType !== "all") {
      whereClause.userType = userType as UserType;
    }

    if (status !== "all") {
      whereClause.status = status as UserStatus;
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          alumniProfile: {
            select: {
              id: true,
              headline: true,
              graduationYear: true,
              currentCompany: true,
              currentTitle: true,
              isVerified: true,
            },
          },
          studentProfile: {
            select: {
              id: true,
              headline: true,
              expectedGraduation: true,
              major: true,
              isVerified: true,
            },
          },
          userRoles: {
            where: {
              organizationId: targetOrgId || undefined,
              revokedAt: null,
            },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  priority: true,
                },
              },
            },
          },
          _count: {
            select: {
              posts: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Filter by role if specified
    let filteredUsers = users;
    if (role) {
      filteredUsers = users.filter(user => 
        user.userRoles.some(ur => ur.role.slug === role)
      );
    }

    // Format users for response
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      userType: user.userType,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      
      // Profile data
      headline: user.alumniProfile?.headline || user.studentProfile?.headline,
      graduationYear: user.alumniProfile?.graduationYear,
      expectedGraduation: user.studentProfile?.expectedGraduation,
      currentCompany: user.alumniProfile?.currentCompany,
      currentTitle: user.alumniProfile?.currentTitle,
      major: user.studentProfile?.major,
      isVerified: user.alumniProfile?.isVerified || user.studentProfile?.isVerified,
      
      // Roles
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        slug: ur.role.slug,
        priority: ur.role.priority,
      })),
      
      // Stats
      postCount: user._count.posts,
    }));

    // Get organization statistics
    let orgStats = null;
    if (targetOrgId) {
      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        alumniCount,
        studentCount,
        adminCount,
      ] = await Promise.all([
        prisma.user.count({
          where: { organizationId: targetOrgId, deletedAt: null },
        }),
        prisma.user.count({
          where: { organizationId: targetOrgId, status: UserStatus.active, deletedAt: null },
        }),
        prisma.user.count({
          where: { organizationId: targetOrgId, status: UserStatus.pending, deletedAt: null },
        }),
        prisma.user.count({
          where: { organizationId: targetOrgId, userType: UserType.alumni, deletedAt: null },
        }),
        prisma.user.count({
          where: { organizationId: targetOrgId, userType: UserType.student, deletedAt: null },
        }),
        prisma.userRole.count({
          where: {
            organizationId: targetOrgId,
            role: { slug: { in: ["admin", "super-admin"] } },
            revokedAt: null,
          },
        }),
      ]);

      orgStats = {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        alumni: alumniCount,
        students: studentCount,
        admins: adminCount,
      };
    }

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      stats: orgStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/* ✅ CREATE/INVITE USER (ADMIN) */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      organizationId,
      userType = "alumni",
      roleId,
      sendEmail = true,
    } = body;

    if (!email || !organizationId || !firstName) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, organizationId" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
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
        fullName: true,
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

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const isOrgAdmin = currentUser.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to create users" },
        { status: 403 }
      );
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, isActive: true },
    });

    if (!organization || !organization.isActive) {
      return NextResponse.json(
        { error: "Organization not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        emailNormalized: email.toLowerCase(),
      },
    });

    if (existingUser) {
      // If user exists but not in this organization, send invitation
      if (existingUser.organizationId !== organizationId) {
        // Check for existing pending invite
        const existingInvite = await prisma.orgInvitation.findFirst({
          where: {
            email: email.toLowerCase(),
            organizationId,
            status: InviteStatus.pending,
            expiresAt: { gt: new Date() },
          },
        });

        if (existingInvite) {
          return NextResponse.json(
            { error: "An invitation has already been sent to this email" },
            { status: 409 }
          );
        }

        // Create invitation
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invitation = await prisma.orgInvitation.create({
          data: {
            organizationId,
            invitedBy: currentUser.id,
            roleId: roleId || null,
            userType: userType as UserType,
            email: email.toLowerCase(),
            token,
            status: InviteStatus.pending,
            expiresAt,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Invitation sent to existing user",
          invitation: {
            id: invitation.id,
            email: invitation.email,
            expiresAt: invitation.expiresAt,
          },
        }, { status: 201 });
      }

      return NextResponse.json(
        { error: "User already exists in this organization" },
        { status: 409 }
      );
    }

    // Determine role ID
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: {
          organizationId,
          slug: userType,
          isDefault: true,
        },
      });
      if (defaultRole) {
        finalRoleId = defaultRole.id;
      }
    }

    // Create new user
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          emailNormalized: email.toLowerCase(),
          firstName,
          fullName: `${firstName} ${String(lastName || "").trim()}`.trim(),
          organizationId,
          status: UserStatus.pending,
          userType: userType as UserType,
          emailVerified: false,
          metadata: {
            invitedBy: currentUser.id,
            invitedAt: new Date().toISOString(),
            ...(lastName ? { lastName } : {}),
          },
        },
      });

      // Assign role if provided
      if (finalRoleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: finalRoleId,
            organizationId,
            grantedBy: currentUser.id,
            grantedReason: "User created by admin",
          },
        });
      }

      // Create profile based on user type
      if (userType === UserType.alumni) {
        await tx.alumniProfile.create({
          data: {
            userId: user.id,
            organizationId,
          },
        });
      } else if (userType === UserType.student) {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            organizationId,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: currentUser.id,
          action: "user.created",
          entityType: "user",
          entityId: user.id,
          entityLabel: user.email,
          afterState: {
            userType,
            createdBy: currentUser.id,
          },
          severity: "info",
        },
      });

      return user;
    });

    // Generate invitation token for the new user
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.orgInvitation.create({
      data: {
        organizationId,
        invitedBy: currentUser.id,
        roleId: finalRoleId,
        userType: userType as UserType,
        email: email.toLowerCase(),
        token,
        status: InviteStatus.pending,
        expiresAt,
      },
    });

    // TODO: Send email invitation
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${token}`;
    
    // Create notification for the new user
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        organizationId,
        type: "welcome",
        category: "system",
        title: `Welcome to ${organization.name}!`,
        body: `You've been added to ${organization.name} by ${currentUser.fullName}. Complete your profile to get started.`,
        payload: {
          invitedBy: currentUser.id,
          organizationId,
        },
        actionUrl: "/dashboard/profile/edit",
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully. An invitation has been sent.",
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        userType: newUser.userType,
        status: newUser.status,
      },
      invitation: {
        id: invitation.id,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST users error:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE USER STATUS/ROLE (ADMIN) */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, status, roleId, organizationId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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
        organizationId: true,
        userRoles: {
          include: { role: true },
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
    const targetOrgId = organizationId || currentUser.organizationId;

    const isOrgAdmin = currentUser.userRoles.some(ur => 
      ur.organizationId === targetOrgId && 
      (ur.role.slug === "admin" || ur.role.slug === "super-admin")
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update users" },
        { status: 403 }
      );
    }

    // Update user
    const updateData: any = {};
    if (status) updateData.status = status;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update role if provided
    if (roleId) {
      const existingRole = await prisma.userRole.findFirst({
        where: {
          userId,
          organizationId: targetOrgId,
          revokedAt: null,
        },
      });

      if (existingRole) {
        await prisma.userRole.update({
          where: { id: existingRole.id },
          data: { roleId },
        });
      } else {
        await prisma.userRole.create({
          data: {
            userId,
            roleId,
            organizationId: targetOrgId,
            grantedBy: currentUser.id,
            grantedReason: "Role updated by admin",
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: targetOrgId,
        actorId: currentUser.id,
        action: "user.updated",
        entityType: "user",
        entityId: userId,
        entityLabel: updatedUser.email,
        afterState: { status, roleId },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("PATCH users error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}