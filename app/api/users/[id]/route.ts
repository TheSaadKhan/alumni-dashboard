// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ DELETE/DEACTIVATE USER (ADMIN) */
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
    const permanent = searchParams.get("permanent") === "true";
    const reason = searchParams.get("reason") || "Deactivated by admin";

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

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
        },
        alumniProfile: true,
        studentProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const isTargetSelf = currentUser.id === targetUser.id;
    const targetOrgId = targetUser.organizationId;
    
    const isCurrentUserOrgAdmin = currentUser.userRoles.some(ur => 
      ur.organizationId === targetOrgId && 
      (ur.role.slug === "admin" || ur.role.slug === "super-admin")
    );

    const canDelete = isSuperAdmin || (isCurrentUserOrgAdmin && !isTargetSelf);

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this user" },
        { status: 403 }
      );
    }

    // Prevent deleting super admin (except by another super admin)
    const isTargetSuperAdmin = targetUser.userRoles.some(ur => ur.role.slug === "super-admin");
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot delete a super admin user" },
        { status: 403 }
      );
    }

    // Prevent deleting the last admin
    if (!isSuperAdmin && !isTargetSuperAdmin) {
      const adminCount = await prisma.userRole.count({
        where: {
          organizationId: targetOrgId as string,
          role: { slug: { in: ["admin", "super-admin"] } },
          revokedAt: null,
        },
      });

      const isTargetAdmin = targetUser.userRoles.some(ur => 
        ur.role.slug === "admin" || ur.role.slug === "super-admin"
      );

      if (isTargetAdmin && adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin of the organization" },
          { status: 400 }
        );
      }
    }

    let result;

    if (permanent) {
      // Permanent deletion (hard delete) - only for super admin
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super admin can permanently delete users" },
          { status: 403 }
        );
      }

      result = await prisma.$transaction(async (tx) => {
        // Delete all related records
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.connection.deleteMany({
          where: {
            OR: [{ requesterId: id }, { recipientId: id }],
          },
        });
        await tx.mentorshipRequest.deleteMany({
          where: {
            OR: [{ studentId: id }, { alumniId: id }],
          },
        });
        await tx.post.deleteMany({ where: { authorId: id } });
        await tx.postComment.deleteMany({ where: { authorId: id } });
        await tx.reaction.deleteMany({ where: { userId: id } });
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.jobApplication.deleteMany({ where: { applicantId: id } });
        await tx.eventRegistration.deleteMany({ where: { userId: id } });
        
        if (targetUser.alumniProfile) {
          await tx.alumniProfile.delete({ where: { userId: id } });
        }
        if (targetUser.studentProfile) {
          await tx.studentProfile.delete({ where: { userId: id } });
        }
        
        // Finally delete the user
        const deletedUser = await tx.user.delete({ where: { id } });
        
        // Create audit log
        await tx.auditLog.create({
          data: {
            organizationId: targetOrgId as string,
            actorId: currentUser.id,
            action: "user.permanently_deleted",
            entityType: "user",
            entityId: id,
            entityLabel: targetUser.email,
            afterState: { permanent: true, reason },
            severity: "critical",
          },
        });
        
        return deletedUser;
      });

      return NextResponse.json({
        success: true,
        message: "User permanently deleted",
        user: {
          id: result.id,
          email: result.email,
        },
      });
    } else {
      // Soft delete (deactivate)
      result = await prisma.$transaction(async (tx) => {
        // Revoke all active roles
        await tx.userRole.updateMany({
          where: {
            userId: id,
            organizationId: targetOrgId as string,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: reason,
          },
        });

        // Update user status
        const deactivatedUser = await tx.user.update({
          where: { id },
          data: {
            status: UserStatus.deactivated,
            deactivatedAt: new Date(),
            deactivatedReason: reason,
          },
        });

        // Cancel all pending connection requests
        await tx.connection.updateMany({
          where: {
            OR: [{ requesterId: id }, { recipientId: id }],
            status: "pending",
          },
          data: {
            status: "declined",
            declinedReason: "User account deactivated",
          },
        });

        // Cancel all pending mentorship requests
        await tx.mentorshipRequest.updateMany({
          where: {
            OR: [{ studentId: id }, { alumniId: id }],
            status: "pending",
          },
          data: {
            status: "cancelled",
            cancelledReason: "User account deactivated",
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            organizationId: targetOrgId as string,
            actorId: currentUser.id,
            action: "user.deactivated",
            entityType: "user",
            entityId: id,
            entityLabel: targetUser.email,
            afterState: { status: UserStatus.deactivated, reason },
            severity: "warning",
          },
        });

        // Create notification for the deactivated user
        await tx.notification.create({
          data: {
            userId: id,
            organizationId: targetOrgId as string,
            type: "account_deactivated",
            category: "system",
            title: "Account Deactivated",
            body: `Your account has been deactivated by an administrator. Reason: ${reason}`,
            payload: {
              deactivatedBy: currentUser.id,
              deactivatedAt: new Date().toISOString(),
              reason,
            },
            actionUrl: "/contact-support",
          },
        });

        return deactivatedUser;
      });

      return NextResponse.json({
        success: true,
        message: "User deactivated successfully",
        user: {
          id: result.id,
          email: result.email,
          status: result.status,
          deactivatedAt: result.deactivatedAt,
        },
      });
    }
  } catch (error: any) {
    console.error("Delete user error:", error);
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete user due to existing related records" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to delete user",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ GET USER DETAILS (ADMIN) */
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

    // Get target user with all details
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        alumniProfile: {
          include: {
            workHistory: true,
          },
        },
        studentProfile: {
          include: {},
        },
        userRoles: {
          where: { revokedAt: null },
          include: { role: true },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            jobApplications: true,
            eventRegistrations: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const isSameOrg = currentUser.organizationId === targetUser.organizationId;
    const isOrgAdmin = currentUser.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && (!isSameOrg || !isOrgAdmin)) {
      return NextResponse.json(
        { error: "You don't have permission to view this user" },
        { status: 403 }
      );
    }

    // Format response
    const response: any = {
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        firstName: targetUser.firstName,
        avatarUrl: targetUser.avatarUrl,
        coverImageUrl: targetUser.coverImageUrl,
        phone: targetUser.phone,
        status: targetUser.status,
        userType: targetUser.userType,
        emailVerified: targetUser.emailVerified,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
        lastLoginAt: targetUser.lastLoginAt,
        lastSeenAt: targetUser.lastSeenAt,
        deactivatedAt: targetUser.deactivatedAt,
        deactivatedReason: targetUser.deactivatedReason,
        
        // Organization
        organization: targetUser.organization,
        
        // Roles
        roles: targetUser.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
          description: ur.role.description,
        })),
        
        // Statistics
        stats: {
          posts: targetUser._count.posts,
          comments: targetUser._count.comments,
          jobApplications: targetUser._count.jobApplications,
          eventRegistrations: targetUser._count.eventRegistrations,
        },
      },
    };

    // Add alumni profile if exists
    if (targetUser.alumniProfile) {
      response.user.alumniProfile = {
        headline: targetUser.alumniProfile.headline,
        bio: targetUser.alumniProfile.bio,
        graduationYear: targetUser.alumniProfile.graduationYear,
        degree: targetUser.alumniProfile.degree,
        major: targetUser.alumniProfile.major,
        currentCompany: targetUser.alumniProfile.currentCompany,
        currentTitle: targetUser.alumniProfile.currentTitle,
        industry: targetUser.alumniProfile.industry,
        isVerified: targetUser.alumniProfile.isVerified,
        workHistory: targetUser.alumniProfile.workHistory,
      };
    }

    // Add student profile if exists
    if (targetUser.studentProfile) {
      response.user.studentProfile = {
        headline: targetUser.studentProfile.headline,
        bio: targetUser.studentProfile.bio,
        expectedGraduation: targetUser.studentProfile.expectedGraduation,
        major: targetUser.studentProfile.major,
        isVerified: targetUser.studentProfile.isVerified,
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}