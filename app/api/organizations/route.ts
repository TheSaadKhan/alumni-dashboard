// app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, PlanTier, RoleScope } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ GET USER'S ORGANIZATION */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const includeMembers = searchParams.get("includeMembers") === "true";
    const includeStats = searchParams.get("includeStats") === "true";

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        userType: true,
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

    if (!user) {
      return NextResponse.json(
        { success: true, organization: null, message: "User profile not found" },
        { status: 200 }
      );
    }

    // If no slug is provided, and user is super_admin, return all organizations
    // If user is not super_admin but searching by name, allow it for onboarding
    const nameSearch = searchParams.get("search");
    if (!slug && (user.userType === UserType.super_admin || nameSearch)) {
      const where: any = { deletedAt: null };
      if (nameSearch) {
        where.OR = [
          { name: { contains: nameSearch, mode: "insensitive" } },
          { displayName: { contains: nameSearch, mode: "insensitive" } },
        ];
        where.isActive = true; // Only show active orgs for public search
      }

      const allOrgs = await prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              events: true,
              jobPostings: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        organizations: allOrgs.map(o => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          planTier: o.planTier,
          isActive: o.isActive,
          isVerified: o.isVerified,
          logoUrl: o.logoUrl,
          memberCount: o._count.users,
          createdAt: o.createdAt,
        })),
        userType: user.userType,
      });
    }

    // Determine which organization to fetch
    let orgId = user.organizationId;
    
    if (slug) {
      const orgBySlug = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });
      
      if (!orgBySlug) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
      
      orgId = orgBySlug.id;
      
      // Check if user has access to this organization
      const isSuperAdmin = user.userType === UserType.super_admin;
      const isOrgMember = user.userRoles.some(ur => ur.organizationId === orgId);
      
      if (!isSuperAdmin && !isOrgMember && user.organizationId !== orgId) {
        return NextResponse.json(
          { error: "Access denied to this organization" },
          { status: 403 }
        );
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { success: true, organization: null, message: "No organization associated with user" },
        { status: 200 }
      );
    }

    // Fetch organization with all details
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
        timezoneRelation: {
          select: {
            name: true,
            utcOffset: true,
          },
        },
        language: {
          select: {
            code: true,
            name: true,
          },
        },
        domains: {
          where: { isVerified: true },
          select: {
            id: true,
            domain: true,
            isPrimary: true,
          },
        },
        _count: {
          select: {
            users: {
              where: { status: "active", deletedAt: null },
            },
            events: {
              where: { deletedAt: null, cancelledAt: null },
            },
            jobPostings: {
              where: { status: "active", deletedAt: null },
            },
            groups: {
              where: { isArchived: false },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get user's role in this organization
    const userRole = await prisma.userRole.findFirst({
      where: {
        organizationId: orgId,
        userId: user.id,
        revokedAt: null,
      },
      include: {
        role: true,
      },
    });

    // Get organization members if requested
    let members = null;
    if (includeMembers) {
      const orgMembers = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          status: "active",
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          avatarUrl: true,
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
        orderBy: { fullName: "asc" },
        take: 20,
      });
      
      members = orgMembers.map(m => ({
        id: m.id,
        name: m.fullName,
        avatar: m.avatarUrl,
        userType: m.userType,
        role: m.userRoles[0]?.role.name || "Member",
      }));
    }

    // Get organization statistics if requested
    let stats = null;
    if (includeStats) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [activeUsers, newUsers, totalPosts, totalComments] = await Promise.all([
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
        prisma.post.count({
          where: {
            organizationId: orgId,
            deletedAt: null,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.postComment.count({
          where: {
            organizationId: orgId,
            isDeleted: false,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);
      
      stats = {
        totalMembers: organization._count.users,
        activeUsers,
        newUsersLast30Days: newUsers,
        postsLast30Days: totalPosts,
        commentsLast30Days: totalComments,
        totalEvents: organization._count.events,
        totalJobs: organization._count.jobPostings,
        totalGroups: organization._count.groups,
      };
    }

    // Get user's permissions
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = userRole?.role.slug === "admin" || userRole?.role.slug === "super-admin";
    
    const permissions = {
      canEdit: isSuperAdmin || isOrgAdmin,
      canManageMembers: isSuperAdmin || isOrgAdmin,
      canManageSettings: isSuperAdmin || isOrgAdmin,
      canDelete: isSuperAdmin,
      canInvite: isSuperAdmin || isOrgAdmin,
    };

    // Prepare response
    const response: any = {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        displayName: organization.displayName,
        logoUrl: organization.logoUrl,
        faviconUrl: organization.faviconUrl,
        website: organization.website,
        description: organization.description,
        establishedYear: organization.establishedYear,
        country: organization.country,
        timezone: organization.timezoneRelation,
        defaultLanguage: organization.language,
        planTier: organization.planTier,
        isActive: organization.isActive,
        isVerified: organization.isVerified,
        customDomain: organization.customDomain,
        primaryColor: organization.primaryColor,
        secondaryColor: organization.secondaryColor,
        settings: organization.settings,
        domains: organization.domains,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        stats: stats || organization._count,
      },
      userRole: userRole ? {
        id: userRole.role.id,
        name: userRole.role.name,
        slug: userRole.role.slug,
        priority: userRole.role.priority,
      } : null,
      permissions,
    };

    if (members) {
      response.members = members;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Organizations GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

/* ✅ CREATE ORGANIZATION (Super Admin only) */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        fullName: true,
        email: true,
      },
    });

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (actor.userType !== UserType.super_admin) {
      return NextResponse.json(
        { error: "Only super admin can create organizations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      slug,
      displayName,
      description,
      website,
      establishedYear,
      countryCode,
      timezone,
      defaultLanguage,
      planTier = "free",
      logoUrl,
      customDomain,
      primaryColor,
      secondaryColor,
      settings = {},
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and Slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }

    // Check if custom domain is unique
    if (customDomain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { customDomain },
      });
      
      if (existingDomain) {
        return NextResponse.json(
          { error: "Custom domain already in use" },
          { status: 409 }
        );
      }
    }

    // Create organization with transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name,
          slug,
          displayName: displayName || name,
          description: description || null,
          website: website || null,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          countryCode: countryCode || null,
          timezone: timezone || null,
          defaultLanguage: defaultLanguage || "en",
          planTier: planTier as PlanTier,
          logoUrl: logoUrl || null,
          customDomain: customDomain || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          settings: settings,
          createdBy: actor.id,
          isActive: true,
          isVerified: true, // Auto-verify orgs created by super admin
          verifiedBy: actor.id,
          verifiedAt: new Date(),
        },
      });

      // Create default roles for the organization
      const rolesData = [
        { name: "super_admin", slug: "super-admin", priority: 100, isSystem: true, description: "Full organization control" },
        { name: "admin", slug: "admin", priority: 80, isSystem: true, description: "Can manage users and settings" },
        { name: "moderator", slug: "moderator", priority: 60, isSystem: true, description: "Can moderate content" },
        { name: "alumni", slug: "alumni", priority: 30, isSystem: true, isDefault: true, description: "Alumni member" },
        { name: "student", slug: "student", priority: 20, isSystem: true, isDefault: true, description: "Student member" },
      ];

      for (const roleData of rolesData) {
        await tx.role.create({
          data: {
            organizationId: newOrg.id,
            ...roleData,
            scope: RoleScope.organization,
          },
        });
      }

      // Assign super admin role to creator
      const superAdminRole = await tx.role.findFirst({
        where: {
          organizationId: newOrg.id,
          slug: "super-admin",
        },
      });

      if (superAdminRole) {
        await tx.userRole.create({
          data: {
            userId: actor.id,
            roleId: superAdminRole.id,
            organizationId: newOrg.id,
            grantedBy: actor.id,
            grantedReason: "Organization creator",
          },
        });
      }

      // Update user's organization
      await tx.user.update({
        where: { id: actor.id },
        data: { organizationId: newOrg.id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: newOrg.id,
          actorId: actor.id,
          action: "organization.created",
          entityType: "organization",
          entityId: newOrg.id,
          entityLabel: newOrg.name,
          afterState: {
            name: newOrg.name,
            slug: newOrg.slug,
            planTier: newOrg.planTier,
          },
          severity: "info",
        },
      });

      return newOrg;
    });

    // Sync organization to Clerk Public Metadata for the creator
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        organizationId: result.id,
        userType: actor.userType
      }
    });

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          planTier: result.planTier,
        },
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Organizations POST failed:", err);
    
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Organization slug or custom domain already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE ORGANIZATION (Admin/Super Admin only) */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await req.json();
    const { organizationId, ...updateData } = body;
    
    const targetOrgId = organizationId || actor.organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organization ID not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isSuperAdmin = actor.userType === UserType.super_admin;
    const isOrgAdmin = actor.userRoles.some(ur => 
      ur.organizationId === targetOrgId && 
      (ur.role.slug === "admin" || ur.role.slug === "super-admin")
    );

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this organization" },
        { status: 403 }
      );
    }

    // Prepare update payload
    const payload: any = {};
    
    const allowedFields = [
      "name", "displayName", "description", "website", "logoUrl", "faviconUrl",
      "establishedYear", "countryCode", "timezone", "defaultLanguage",
      "customDomain", "primaryColor", "secondaryColor", "settings",
      "isActive", "isVerified", "planTier",
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === "establishedYear" && updateData[field]) {
          payload[field] = parseInt(updateData[field]);
        } else {
          payload[field] = updateData[field];
        }
      }
    }

    // If updating slug, check uniqueness
    if (updateData.slug && updateData.slug !== updateData.slug) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: targetOrgId },
        },
      });
      
      if (existingOrg) {
        return NextResponse.json(
          { error: "Organization slug already exists" },
          { status: 409 }
        );
      }
      payload.slug = updateData.slug;
    }

    // If updating custom domain, check uniqueness
    if (updateData.customDomain) {
      const existingDomain = await prisma.organization.findFirst({
        where: {
          customDomain: updateData.customDomain,
          id: { not: targetOrgId },
        },
      });
      
      if (existingDomain) {
        return NextResponse.json(
          { error: "Custom domain already in use" },
          { status: 409 }
        );
      }
      payload.customDomain = updateData.customDomain;
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: targetOrgId },
      data: payload,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: targetOrgId,
        actorId: actor.id,
        action: "organization.updated",
        entityType: "organization",
        entityId: targetOrgId,
        entityLabel: organization.name,
        afterState: { updatedFields: Object.keys(payload) },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        displayName: organization.displayName,
        logoUrl: organization.logoUrl,
        planTier: organization.planTier,
        isActive: organization.isActive,
        isVerified: organization.isVerified,
      },
      message: "Organization updated successfully",
    });
  } catch (err: any) {
    console.error("Organizations PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

/* ✅ DELETE ORGANIZATION (Super Admin only) */
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

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
      },
    });

    if (!actor) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (actor.userType !== UserType.super_admin) {
      return NextResponse.json(
        { error: "Only super admin can delete organizations" },
        { status: 403 }
      );
    }

    // Soft delete the organization
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: actor.id,
        action: "organization.deleted",
        entityType: "organization",
        entityId: organizationId,
        entityLabel: organization.name,
        severity: "critical",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (err: any) {
    console.error("Organizations DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}