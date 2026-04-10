"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { UserType, RoleScope } from "@/lib/generated/prisma";

/* -------------------------------------------
   SLUG HELPERS
-------------------------------------------- */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function createUniqueSlug(baseSlug: string, organizationId?: string) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.organization.findFirst({
      where: { 
        slug,
        ...(organizationId ? { NOT: { id: organizationId } } : {})
      }
    });
    if (!exists) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/* -------------------------------------------
   INPUT TYPE
-------------------------------------------- */

export type CreateOrgInput = {
  name: string;
  type: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country: string;
  };
  logoUrl?: string;
  coverImageUrl?: string;
  customDomain?: string;
  primaryColor?: string;
};

/* -------------------------------------------
   ✅ UPDATED MAIN ACTION WITH PROPER HIERARCHY
-------------------------------------------- */

export async function createOrganizationAction(input: CreateOrgInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  // Find the user by Clerk ID
  const user = await prisma.user.findFirst({
    where: { 
      metadata: { 
        path: ["clerkId"], 
        equals: userId 
      } 
    },
    select: { 
      id: true, 
      userType: true,
      email: true,
      fullName: true 
    },
  });

  if (!user) throw new Error("User profile not found.");

  // Removed SUPER ADMIN restriction to allow any user to create an org and be promoted

  // Create org slug
  const baseSlug = slugify(input.name);
  const slug = await createUniqueSlug(baseSlug);

  /* -------------------------------------------
     TRANSACTION WITH COMPLETE SETUP
  -------------------------------------------- */

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create organization
    const org = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        displayName: input.name,
        description: input.description ?? "",
        website: input.website ?? "",
        logoUrl: input.logoUrl ?? "",
        establishedYear: input.establishedYear ?? null,
        countryCode: null, // Set after countries table is seeded — stored in settings for now
        customDomain: input.customDomain ?? null,
        primaryColor: input.primaryColor ?? null,
        createdBy: user.id,
        isActive: true,
        isVerified: true, // Auto-verify orgs created by super admin
        verifiedBy: user.id,
        verifiedAt: new Date(),
        settings: {
          organizationType: input.type,
          address: input.address ?? null,
          countryCode: input.address?.country?.slice(0, 2)?.toUpperCase() || null,
          coverImageUrl: input.coverImageUrl ?? "",
          defaultLanguage: "en",
          timezone: "UTC",
        },
        metadata: {
          createdVia: "super_admin_onboarding",
          creatorEmail: user.email,
        },
      },
    });

    // 2. Create organization roles with proper hierarchy
    const rolesData = [
      { 
        name: "super_admin", 
        slug: "super-admin", 
        priority: 100, 
        scope: RoleScope.organization,
        isSystem: true, 
        isDefault: false, 
        description: "Full organization control, can manage all settings and users"
      },
      { 
        name: "admin", 
        slug: "admin", 
        priority: 80, 
        scope: RoleScope.organization,
        isSystem: true, 
        isDefault: false, 
        description: "Can manage users, content, and settings except billing"
      },
      { 
        name: "moderator", 
        slug: "moderator", 
        priority: 60, 
        scope: RoleScope.organization,
        isSystem: true, 
        isDefault: false, 
        description: "Can moderate content and manage reports"
      },
      { 
        name: "alumni", 
        slug: "alumni", 
        priority: 30, 
        scope: RoleScope.organization,
        isSystem: true, 
        isDefault: true, 
        description: "Alumni member with standard access"
      },
      { 
        name: "student", 
        slug: "student", 
        priority: 20, 
        scope: RoleScope.organization,
        isSystem: true, 
        isDefault: true, 
        description: "Student member with limited access"
      },
    ];

    for (const roleData of rolesData) {
      await tx.role.upsert({
        where: { 
          organizationId_slug: {
            organizationId: org.id,
            slug: roleData.slug
          }
        },
        update: {},
        create: {
          organizationId: org.id,
          ...roleData,
        },
      });
    }

    // 3. Get super_admin role and assign to creator
    const superAdminRole = await tx.role.findFirst({
      where: { 
        organizationId: org.id, 
        slug: "super-admin" 
      },
    });
    
    if (!superAdminRole) {
      throw new Error("super_admin role creation failed!");
    }

    await tx.userRole.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        roleId: superAdminRole.id,
        grantedBy: user.id,
        grantedReason: "Organization creator - automatic super admin assignment",
      },
    });

    // 4. Update user's organization association and promote them to super_admin
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        userType: UserType.super_admin,
        status: "active",
      },
    });

    // 5. Create default notification preferences for the user
    await tx.notificationPreference.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        notificationType: "all",
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: false,
        digestFrequency: "instant",
      },
    });

    // 6. Create audit log entry
    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        actorId: user.id,
        actorEmail: user.email,
        action: "organization.created",
        entityType: "organization",
        entityId: org.id,
        entityLabel: org.name,
        afterState: { name: org.name, slug: org.slug },
        severity: "info",
      },
    });

    return { org, slug };
  });

  return {
    success: true,
    organizationId: result.org.id,
    slug: result.slug,
    name: result.org.name,
  };
}

/* -------------------------------------------
   UPDATE ORGANIZATION ACTION
-------------------------------------------- */

export type UpdateOrgInput = Partial<CreateOrgInput> & {
  organizationId: string;
};

export async function updateOrganizationAction(input: UpdateOrgInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  const { organizationId, ...updateData } = input;

  // Find the user
  const user = await prisma.user.findFirst({
    where: { 
      metadata: { 
        path: ["clerkId"], 
        equals: userId 
      } 
    },
    select: { id: true, userType: true },
  });

  if (!user) throw new Error("User not found.");

  // Check if user has admin access to this organization
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      organizationId: organizationId,
      role: {
        OR: [
          { slug: "super-admin" },
          { slug: "admin" }
        ]
      }
    },
    include: { role: true }
  });

  const isSuperAdmin = user.userType === UserType.super_admin;
  
  if (!isSuperAdmin && !userRole) {
    throw new Error("You don't have permission to update this organization.");
  }

  // Prepare update data
  const updatePayload: any = {};
  
  if (updateData.name) {
    updatePayload.name = updateData.name;
    updatePayload.displayName = updateData.name;
    if (updateData.name !== updateData.name) {
      updatePayload.slug = await createUniqueSlug(slugify(updateData.name), organizationId);
    }
  }
  
  if (updateData.description !== undefined) updatePayload.description = updateData.description;
  if (updateData.website !== undefined) updatePayload.website = updateData.website;
  if (updateData.establishedYear !== undefined) updatePayload.establishedYear = updateData.establishedYear;
  if (updateData.logoUrl !== undefined) updatePayload.logoUrl = updateData.logoUrl;
  if (updateData.customDomain !== undefined) updatePayload.customDomain = updateData.customDomain;
  if (updateData.primaryColor !== undefined) updatePayload.primaryColor = updateData.primaryColor;
  
  if (updateData.address?.country) {
    updatePayload.countryCode = updateData.address.country.slice(0, 2).toUpperCase();
  }

  // Update settings in metadata
  if (updateData.type || updateData.address || updateData.coverImageUrl) {
    const currentOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true }
    });
    
    updatePayload.settings = {
      ...(currentOrg?.settings as object || {}),
      ...(updateData.type && { organizationType: updateData.type }),
      ...(updateData.address && { address: updateData.address }),
      ...(updateData.coverImageUrl && { coverImageUrl: updateData.coverImageUrl }),
    };
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: updatePayload,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: user.id,
      action: "organization.updated",
      entityType: "organization",
      entityId: org.id,
      entityLabel: org.name,
      afterState: { updatedFields: Object.keys(updatePayload) },
      severity: "info",
    },
  });

  return {
    success: true,
    organization: org,
  };
}

/* -------------------------------------------
   GET USER'S ORGANIZATIONS (For Super Admin)
-------------------------------------------- */

export async function getUserOrganizationsAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  const user = await prisma.user.findFirst({
    where: { 
      metadata: { 
        path: ["clerkId"], 
        equals: userId 
      } 
    },
    select: { id: true, userType: true },
  });

  if (!user) throw new Error("User not found.");

  // Super admin can see all organizations
  if (user.userType === UserType.super_admin) {
    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    return { organizations: orgs };
  }

  // Regular users see only their organizations
  const userOrgs = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: true,
      userRoles: {
        include: { role: true }
      }
    }
  });

  return {
    organizations: userOrgs?.organization ? [userOrgs.organization] : [],
    roles: userOrgs?.userRoles || []
  };
}