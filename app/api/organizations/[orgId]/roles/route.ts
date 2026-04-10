// app/api/organizations/[orgId]/roles/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { UserType, RoleScope } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ORGANIZATION ROLES */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get("includeSystem") === "true";
    const includeCounts = searchParams.get("includeCounts") === "true";

    // Get current user
    const actor = await prisma.user.findFirst({
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
            organizationId: orgId,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check access to organization
    const isSuperAdmin = actor.userType === UserType.super_admin;
    const isMember = actor.organizationId === orgId || actor.userRoles.length > 0;

    if (!isSuperAdmin && !isMember) {
      return NextResponse.json(
        { error: "Access denied to this organization" },
        { status: 403 }
      );
    }

    // Build where clause for roles
    const whereClause: any = { organizationId: orgId };
    
    if (!includeSystem) {
      whereClause.isSystem = false;
    }

    // Fetch roles
    const roles = await prisma.role.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priority: true,
        isSystem: true,
        isDefault: true,
        color: true,
        icon: true,
        scope: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { priority: "desc" },
    });

    // Get member counts for each role if requested
    let rolesWithCounts = roles;
    if (includeCounts) {
      const rolesWithMembers = await Promise.all(
        roles.map(async (role) => {
          const memberCount = await prisma.userRole.count({
            where: {
              roleId: role.id,
              organizationId: orgId,
              revokedAt: null,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          });
          
          return {
            ...role,
            memberCount,
          };
        })
      );
      rolesWithCounts = rolesWithMembers;
    }

    // Get user's permissions for role management
    const actorRole = actor.userRoles[0]?.role;
    const canManageRoles = isSuperAdmin || (actorRole && (actorRole.slug === "admin" || actorRole.slug === "super-admin"));

    // Get available role hierarchy for role creation/assignment
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    const actorRoleSlug = actorRole?.slug || "member";
    const creatableRoles = canManageRoles ? roleHierarchy[actorRoleSlug] || [] : [];

    // Get system default roles
    const defaultRoles = roles.filter(r => r.isDefault);

    return NextResponse.json({
      success: true,
      roles: rolesWithCounts,
      permissions: {
        canManageRoles,
        canCreateRoles: canManageRoles,
        canEditRoles: canManageRoles,
        canDeleteRoles: canManageRoles && !isSuperAdmin, // Super admin can't delete system roles
        creatableRoles,
      },
      meta: {
        total: roles.length,
        systemRoles: roles.filter(r => r.isSystem).length,
        customRoles: roles.filter(r => !r.isSystem).length,
        defaultRoles: defaultRoles.map(r => r.slug),
      },
    });
  } catch (error: any) {
    console.error("Get organization roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

/* ✅ CREATE NEW ROLE (Admin/Super Admin only) */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await request.json();
    const { name, slug, description, priority, color, icon, isDefault = false } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Get current user and check permissions
    const actor = await prisma.user.findFirst({
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

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = actor.userType === UserType.super_admin;
    const actorRole = actor.userRoles[0]?.role;
    const canCreateRole = isSuperAdmin || (actorRole && (actorRole.slug === "admin" || actorRole.slug === "super-admin"));

    if (!canCreateRole) {
      return NextResponse.json(
        { error: "You don't have permission to create roles" },
        { status: 403 }
      );
    }

    // Check if slug is unique within organization
    const existingRole = await prisma.role.findFirst({
      where: {
        organizationId: orgId,
        slug,
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this slug already exists" },
        { status: 409 }
      );
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        organizationId: orgId,
        name,
        slug,
        description: description || null,
        priority: priority || 0,
        color: color || null,
        icon: icon || null,
        isDefault,
        isSystem: false,
        scope: RoleScope.organization,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: actor.id,
        action: "role.created",
        entityType: "role",
        entityId: role.id,
        entityLabel: role.name,
        afterState: {
          name: role.name,
          slug: role.slug,
          priority: role.priority,
        },
        severity: "info",
      },
    });

    return NextResponse.json(
      {
        success: true,
        role,
        message: "Role created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create role error:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE ROLE (Admin/Super Admin only) */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, priority, color, icon, isDefault } = body;

    // Get current user and check permissions
    const actor = await prisma.user.findFirst({
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

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = actor.userType === UserType.super_admin;
    const actorRole = actor.userRoles[0]?.role;
    const canEditRole = isSuperAdmin || (actorRole && (actorRole.slug === "admin" || actorRole.slug === "super-admin"));

    if (!canEditRole) {
      return NextResponse.json(
        { error: "You don't have permission to edit roles" },
        { status: 403 }
      );
    }

    // Get the role to update
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: orgId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent editing system role slugs
    if (existingRole.isSystem && (name !== existingRole.name || body.slug !== existingRole.slug)) {
      return NextResponse.json(
        { error: "System role names and slugs cannot be changed" },
        { status: 403 }
      );
    }

    // Update the role
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isDefault !== undefined && !existingRole.isSystem) updateData.isDefault = isDefault;

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: actor.id,
        action: "role.updated",
        entityType: "role",
        entityId: roleId,
        entityLabel: updatedRole.name,
        afterState: { updatedFields: Object.keys(updateData) },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      role: updatedRole,
      message: "Role updated successfully",
    });
  } catch (error: any) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

/* ✅ DELETE ROLE (Admin/Super Admin only) */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Get current user and check permissions
    const actor = await prisma.user.findFirst({
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

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isSuperAdmin = actor.userType === UserType.super_admin;
    const actorRole = actor.userRoles[0]?.role;
    const canDeleteRole = isSuperAdmin || (actorRole && (actorRole.slug === "admin" || actorRole.slug === "super-admin"));

    if (!canDeleteRole) {
      return NextResponse.json(
        { error: "You don't have permission to delete roles" },
        { status: 403 }
      );
    }

    // Get the role to delete
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: orgId,
      },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 403 }
      );
    }

    // Check if role has members
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete role that has members assigned",
          memberCount: role._count.userRoles,
        },
        { status: 400 }
      );
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: actor.id,
        action: "role.deleted",
        entityType: "role",
        entityId: roleId,
        entityLabel: role.name,
        severity: "warning",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete role error:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}