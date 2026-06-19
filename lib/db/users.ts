import { prisma } from "@/lib/prisma";
import { UserStatus, UserType } from "@/lib/generated/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function createUniqueOrganizationSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organization.findFirst({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
    include: {
      organization: true,
      alumniProfile: true,
      studentProfile: true,
    },
  });
}

export async function syncClerkUser(user: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  organizationId?: string; // Default organization if any
}) {
  const existingUser = await getUserByClerkId(user.clerkId);

  if (existingUser) {
    return existingUser;
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const isConfiguredSuperAdmin =
    !!superAdminEmail && user.email.toLowerCase() === superAdminEmail;

  // Link Clerk account to seeded super admin row
  if (isConfiguredSuperAdmin) {
    const seededAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { emailNormalized: superAdminEmail },
          { userType: UserType.super_admin },
        ],
      },
      include: { organization: true },
    });

    if (seededAdmin) {
      return await prisma.user.update({
        where: { id: seededAdmin.id },
        data: {
          metadata: {
            ...(typeof seededAdmin.metadata === "object" && seededAdmin.metadata !== null
              ? seededAdmin.metadata
              : {}),
            clerkId: user.clerkId,
          },
          avatarUrl: user.imageUrl || seededAdmin.avatarUrl,
          firstName: user.firstName || seededAdmin.firstName,
          fullName: `${user.firstName} ${user.lastName}`.trim() || seededAdmin.fullName,
          email: user.email,
          emailNormalized: user.email.toLowerCase(),
          userType: UserType.super_admin,
          status: UserStatus.active,
        },
        include: {
          organization: true,
          alumniProfile: true,
          studentProfile: true,
        },
      });
    }
  }

  const orgId = user.organizationId ?? null;
  let isSuperAdmin = false;

  // Do not auto-assign generic signups to an existing organization.
  // If no organization exists yet, the first signup becomes a super admin
  // and can create the organization from the setup flow.
  if (!orgId) {
    const existingOrg = await prisma.organization.findFirst();
    if (!existingOrg) {
      isSuperAdmin = true;
    }
  }

  return await prisma.user.create({
    data: {
      ...(orgId && { organizationId: orgId }),
      email: user.email,
      emailNormalized: user.email.toLowerCase(),
      firstName: user.firstName,
      fullName: `${user.firstName} ${user.lastName}`,
      avatarUrl: user.imageUrl,
      status: UserStatus.pending,
      userType: isSuperAdmin ? UserType.super_admin : UserType.alumni,
      metadata: {
        clerkId: user.clerkId,
      },
      emailVerified: true, // Clerk already verified it
    },
  });
}
