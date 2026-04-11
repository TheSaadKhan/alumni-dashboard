// app/api/admin/users/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ UPDATE USER STATUS (ADMIN) */
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
    const { 
      status, 
      isActive, 
      reason, 
      suspendedUntil,
      organizationId 
    } = body;

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
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Determine target organization
    const targetOrgId = organizationId || targetUser.organizationId || currentUser.organizationId;

    // Check permissions
    const isSuperAdmin = currentUser.userType === UserType.super_admin;
    const isTargetSelf = currentUser.id === targetUser.id;
    
    const isCurrentUserOrgAdmin = currentUser.userRoles.some(ur => 
      ur.organizationId === targetOrgId && 
      (ur.role.slug === "admin" || ur.role.slug === "super-admin")
    );

    const canUpdateStatus = isSuperAdmin || (isCurrentUserOrgAdmin && !isTargetSelf);

    if (!canUpdateStatus) {
      return NextResponse.json(
        { error: "You don't have permission to update this user's status" },
        { status: 403 }
      );
    }

    // Prevent modifying super admin status (except by another super admin)
    const isTargetSuperAdmin = targetUser.userRoles.some(ur => ur.role.slug === "super-admin");
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot modify super admin user status" },
        { status: 403 }
      );
    }

    // Determine new status
    let newStatus: UserStatus;
    let statusReason = reason || "";
    let statusExpiresAt = null;

    if (status) {
      // Direct status update
      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      newStatus = status as UserStatus;
    } else if (typeof isActive === "boolean") {
      // Legacy isActive flag
      newStatus = isActive ? UserStatus.active : UserStatus.suspended;
    } else {
      return NextResponse.json(
        { error: "Either status or isActive is required" },
        { status: 400 }
      );
    }

    // Handle suspended until date
    if (newStatus === UserStatus.suspended && suspendedUntil) {
      statusExpiresAt = new Date(suspendedUntil);
      if (isNaN(statusExpiresAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid suspendedUntil date" },
          { status: 400 }
        );
      }
    }

    // Validate status transition
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.active]: [UserStatus.suspended, UserStatus.deactivated],
      [UserStatus.suspended]: [UserStatus.active, UserStatus.deactivated],
      [UserStatus.pending]: [UserStatus.active, UserStatus.deactivated],
      [UserStatus.deactivated]: [], // Cannot reactivate from deactivated
      [UserStatus.deleted]: [], // Cannot modify deleted users
    };

    if (!validTransitions[targetUser.status]?.includes(newStatus)) {
      return NextResponse.json(
        { 
          error: `Cannot transition from ${targetUser.status} to ${newStatus}`,
          allowedTransitions: validTransitions[targetUser.status] || [],
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
    };

    if (statusReason) {
      if (newStatus === UserStatus.suspended) {
        updateData.metadata = {
          ...(targetUser.metadata as any || {}),
          suspensionReason: statusReason,
          suspendedBy: currentUser.id,
          suspendedAt: new Date().toISOString(),
        };
      } else if (newStatus === UserStatus.deactivated) {
        updateData.deactivatedReason = statusReason;
        updateData.deactivatedAt = new Date();
      }
    }

    if (statusExpiresAt) {
      updateData.metadata = {
        ...(targetUser.metadata as any || {}),
        suspendedUntil: statusExpiresAt.toISOString(),
      };
    }

    // If reactivating, clear suspension data
    if (newStatus === UserStatus.active && targetUser.status === UserStatus.suspended) {
      updateData.metadata = {
        ...(targetUser.metadata as any || {}),
        suspensionReason: null,
        suspendedBy: null,
        suspendedAt: null,
        suspendedUntil: null,
      };
    }

    // Update user status
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // If suspending, cancel pending connections and mentorship requests
      if (newStatus === UserStatus.suspended) {
        await tx.connection.updateMany({
          where: {
            OR: [{ requesterId: id }, { recipientId: id }],
            status: "pending",
          },
          data: {
            status: "declined",
            declinedReason: `User suspended: ${statusReason || "Account suspended"}`,
          },
        });

        await tx.mentorshipRequest.updateMany({
          where: {
            OR: [{ studentId: id }, { alumniId: id }],
            status: "pending",
          },
          data: {
            status: "cancelled",
            cancelledReason: `User suspended: ${statusReason || "Account suspended"}`,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: targetOrgId as string,
          actorId: currentUser.id,
          action: "user.status_updated",
          entityType: "user",
          entityId: id,
          entityLabel: targetUser.email,
          afterState: {
            oldStatus: targetUser.status,
            newStatus,
            reason: statusReason,
            suspendedUntil: statusExpiresAt,
          },
          severity: newStatus === UserStatus.suspended ? "warning" : "info",
        },
      });

      // Create notification for the user
      let notificationTitle = "";
      let notificationBody = "";
      let notificationType = "";

      switch (newStatus) {
        case UserStatus.active:
          notificationTitle = "Account Activated";
          notificationBody = `Your account has been reactivated. You can now access the platform.`;
          notificationType = "account_activated";
          break;
        case UserStatus.suspended:
          notificationTitle = "Account Suspended";
          notificationBody = `Your account has been suspended. Reason: ${statusReason || "Violation of terms"}`;
          if (statusExpiresAt) {
            notificationBody += ` This suspension will last until ${statusExpiresAt.toLocaleDateString()}.`;
          }
          notificationType = "account_suspended";
          break;
        case UserStatus.deactivated:
          notificationTitle = "Account Deactivated";
          notificationBody = `Your account has been deactivated. Reason: ${statusReason || "Account closed"}`;
          notificationType = "account_deactivated";
          break;
      }

      if (notificationTitle) {
        await tx.notification.create({
          data: {
            userId: id,
            organizationId: targetOrgId as string,
            type: notificationType,
            category: "system",
            title: notificationTitle,
            body: notificationBody,
            payload: {
              oldStatus: targetUser.status,
              newStatus,
              reason: statusReason,
              suspendedUntil: statusExpiresAt,
              updatedBy: currentUser.id,
              updatedByName: currentUser.fullName,
            },
            actionUrl: "/dashboard",
          },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to ${newStatus}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        status: updatedUser.status,
        deactivatedAt: updatedUser.deactivatedAt,
        deactivatedReason: updatedUser.deactivatedReason,
        metadata: updatedUser.metadata,
      },
    });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update user status",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ BULK UPDATE USER STATUSES (ADMIN) */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, status, reason } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs array is required" },
        { status: 400 }
      );
    }

    if (!status || !Object.values(UserStatus).includes(status as UserStatus)) {
      return NextResponse.json(
        { error: "Valid status is required" },
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
    const isOrgAdmin = currentUser.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to perform bulk status updates" },
        { status: 403 }
      );
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        ...(isSuperAdmin ? {} : { organizationId: currentUser.organizationId }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "No valid users found" },
        { status: 404 }
      );
    }

    // Filter out super admins if current user is not super admin
    let usersToUpdate = targetUsers;
    if (!isSuperAdmin) {
      usersToUpdate = targetUsers.filter(u => 
        !u.userRoles.some(ur => ur.role.slug === "super-admin")
      );
    }

    // Update all users
    const results = await prisma.$transaction(async (tx) => {
      const updates = [];
      for (const user of usersToUpdate) {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { status: status as UserStatus },
        });
        updates.push(updated);
        
        // Create audit log for each user
        await tx.auditLog.create({
          data: {
            organizationId: currentUser.organizationId as string,
            actorId: currentUser.id,
            action: "user.bulk_status_updated",
            entityType: "user",
            entityId: user.id,
            entityLabel: user.email,
            afterState: {
              oldStatus: user.status,
              newStatus: status,
              reason: reason || "Bulk update",
            },
            severity: "info",
          },
        });
      }
      return updates;
    });

    return NextResponse.json({
      success: true,
      message: `${results.length} user(s) status updated to ${status}`,
      updatedCount: results.length,
      skippedCount: targetUsers.length - usersToUpdate.length,
    });
  } catch (error: any) {
    console.error("Bulk update status error:", error);
    return NextResponse.json(
      { error: "Failed to update user statuses" },
      { status: 500 }
    );
  }
}