"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/* -------------------------------------------
   SLUG HELPERS
-------------------------------------------- */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function createUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.organizations.findUnique({ where: { slug } });
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
  description?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
};

/* -------------------------------------------
   MAIN ACTION — ONLY SUPER_ADMIN CAN CREATE ORG
-------------------------------------------- */

export async function createOrganizationAction(input: CreateOrgInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");

  // Fetch profile of logged user
  const profile = await prisma.profiles.findUnique({
    where: { auth_user_id: userId },
  });

  if (!profile) throw new Error("Profile not found.");

  // ❗ NEW ROLE CHECK
  if (profile.user_type !== "super_admin") {
    throw new Error("Only SUPER ADMIN can create organizations.");
  }

  // Create org slug
  const baseSlug = slugify(input.name);
  const slug = await createUniqueSlug(baseSlug);

  /* -------------------------------------------
     TRANSACTION — CREATE ORG + ROLES + MEMBER
  -------------------------------------------- */

  const result = await prisma.$transaction(async (tx) => {
    /* 1️⃣ Create Organization */
    const org = await tx.organizations.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? "",
        website: input.website ?? "",
        logo_url: input.logo_url ?? "",
        metadata: {
          cover_image_url: input.cover_image_url ?? "",
        },
        created_by: userId,
      },
    });

    /* 2️⃣ Create the FOUR system roles (new simplified system) */
    const roles = await tx.organization_roles.createManyAndReturn({
      data: [
        {
          organization_id: org.id,
          name: "super_admin",
          display_name: "Super Admin",
          hierarchy_level: 100,
          permissions: {
            manage_org: true,
            manage_roles: true,
            manage_admins: true,
            manage_members: true,
          },
          can_invite_roles: ["admin"],
          is_system_role: true,
        },
        {
          organization_id: org.id,
          name: "admin",
          display_name: "Administrator",
          hierarchy_level: 70,
          permissions: {
            manage_members: true,
            add_students: true,
            add_alumni: true,
          },
          can_invite_roles: ["alumni", "student"],
          is_system_role: true,
        },
        {
          organization_id: org.id,
          name: "alumni",
          display_name: "Alumni",
          hierarchy_level: 20,
          permissions: {},
          can_invite_roles: [],
          is_system_role: true,
        },
        {
          organization_id: org.id,
          name: "student",
          display_name: "Student",
          hierarchy_level: 10,
          permissions: {},
          can_invite_roles: [],
          is_system_role: true,
        },
      ],
    });

    const superAdminRole = roles.find((r) => r.name === "super_admin");
    if (!superAdminRole) throw new Error("super_admin role missing!");

    /* 3️⃣ Add SUPER_ADMIN as the first organization member */
    await tx.organization_members.create({
      data: {
        organization_id: org.id,
        user_id: userId,
        role_id: superAdminRole.id,
        membership_status: "active",
        is_active: true,
        is_verified: true,
      },
    });

    /* 4️⃣ Update Profile → link primary organization */
    await tx.profiles.update({
      where: { auth_user_id: userId },
      data: {
        primary_organization_id: org.id,
      },
    });

    return { org, slug };
  });

  return {
    success: true,
    organizationId: result.org.id,
    slug: result.slug,
  };
}
