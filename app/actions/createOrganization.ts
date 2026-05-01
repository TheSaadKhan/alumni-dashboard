"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
  isRequest?: boolean;
};

/* -------------------------------------------
   ✅ UPDATED MAIN ACTION WITH PROPER HIERARCHY
-------------------------------------------- */

export async function createOrganizationAction(input: CreateOrgInput): Promise<{
  success: boolean;
  organizationId: string;
  slug: string;
  name: string;
  isRequest: boolean;
  error?: string;
}> {
  try {
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

  // If a student/alumni is trying to create an org, it's always a request unless they are super_admin
  const isActuallyRequest = !!(user.userType !== UserType.super_admin || input.isRequest);

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
        countryCode: null, 
        customDomain: input.customDomain ?? null,
        primaryColor: input.primaryColor ?? null,
        createdBy: user.id,
        isActive: true,
        isVerified: !isActuallyRequest, 
        verifiedBy: !isActuallyRequest ? user.id : null,
        verifiedAt: !isActuallyRequest ? new Date() : null,
        settings: {
          organizationType: input.type,
          address: input.address ?? null,
          countryCode: input.address?.country?.slice(0, 2)?.toUpperCase() || null,
          coverImageUrl: input.coverImageUrl ?? "",
          defaultLanguage: "en",
          timezone: "UTC",
        },
        metadata: {
          createdVia: isActuallyRequest ? "member_request" : "super_admin_onboarding",
          creatorEmail: user.email,
          requestStatus: isActuallyRequest ? "pending_verification" : "approved",
        },
      },
    });

    // 2. Create organization roles
    const rolesData = [
      { name: "super_admin", slug: "super-admin", priority: 100, scope: RoleScope.organization, isSystem: true, isDefault: false },
      { name: "admin", slug: "admin", priority: 80, scope: RoleScope.organization, isSystem: true, isDefault: false },
      { name: "alumni", slug: "alumni", priority: 30, scope: RoleScope.organization, isSystem: true, isDefault: true },
      { name: "student", slug: "student", priority: 20, scope: RoleScope.organization, isSystem: true, isDefault: true },
    ];

    for (const roleData of rolesData) {
      await tx.role.create({
        data: {
          organizationId: org.id,
          ...roleData,
        },
      });
    }

    // Assign roles
    // If it's a super_admin creating it, they stay super_admin of the new org.
    // If it's a request, the user becomes the 'owner' but org is unverified.
    const superAdminRole = await tx.role.findFirst({
      where: { organizationId: org.id, slug: "super-admin" },
    });
    
    if (superAdminRole) {
      await tx.userRole.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: superAdminRole.id,
          grantedBy: user.id,
        },
      });
    }

    // Only update user's organizationId if it was a request/setup
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        status: "active",
      },
    });

    // Create a verification request record if it's a request
    if (isActuallyRequest) {
      await tx.verificationRequest.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          targetType: "organization_creation",
          status: "pending",
          notes: `Organization creation request for ${org.name} by ${user.fullName} (${user.email})`,
        }
      });
    }

    return { org, slug };
  });

  // Sync to Clerk
  try {
     const client = await clerkClient();
     await client.users.updateUserMetadata(userId, {
        publicMetadata: {
           organizationId: result.org.id,
           organizationSlug: result.slug,
           onboardingCompleted: true,
           // Keep existing userType unless they are a super_admin setting up a new org
           userType: user.userType === UserType.super_admin ? "super_admin" : user.userType
        }
     });
  } catch (err) {
     console.error("Clerk metadata sync failed:", err);
  }

  return {
    success: true,
    organizationId: result.org.id,
    slug: result.slug,
    name: result.org.name,
    isRequest: isActuallyRequest
  };

  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create organization",
      organizationId: "",
      slug: "",
      name: "",
      isRequest: false
    };
  }
}

export type UpdateOrgInput = Partial<CreateOrgInput> & {
  organizationId: string;
};

export async function updateOrganizationAction(input: UpdateOrgInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  const { organizationId, ...updateData } = input;

  const user = await prisma.user.findFirst({
    where: { metadata: { path: ["clerkId"], equals: userId } },
    select: { id: true, userType: true },
  });

  if (!user) throw new Error("User not found.");

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      organizationId: organizationId,
      role: { OR: [{ slug: "super-admin" }, { slug: "admin" }] }
    }
  });

  if (user.userType !== UserType.super_admin && !userRole) {
    throw new Error("You don't have permission to updatez this organization.");
  }

  const updatePayload: any = {};
  if (updateData.name) {
    updatePayload.name = updateData.name;
    updatePayload.displayName = updateData.name;
  }
  if (updateData.description !== undefined) updatePayload.description = updateData.description;
  if (updateData.website !== undefined) updatePayload.website = updateData.website;
  if (updateData.establishedYear !== undefined) updatePayload.establishedYear = updateData.establishedYear;
  if (updateData.logoUrl !== undefined) updatePayload.logoUrl = updateData.logoUrl;
  
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: updatePayload,
  });

  return { success: true, organization: org };
}

export async function getUserOrganizationsAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  const user = await prisma.user.findFirst({
    where: { metadata: { path: ["clerkId"], equals: userId } },
    select: { id: true, userType: true },
  });

  if (!user) throw new Error("User not found.");

  if (user.userType === UserType.super_admin) {
    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } }
    });
    return { organizations: orgs };
  }

  const userOrgs = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true, userRoles: { include: { role: true } } }
  });

  return {
    organizations: userOrgs?.organization ? [userOrgs.organization] : [],
    roles: userOrgs?.userRoles || []
  };
}

export async function searchOrganizationsAction(query: string) {
  if (!query || query.length < 2) return { organizations: [] };

  const orgs = await prisma.organization.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ]
    },
    select: { id: true, name: true, slug: true, logoUrl: true },
    take: 10
  });

  return { organizations: orgs };
}