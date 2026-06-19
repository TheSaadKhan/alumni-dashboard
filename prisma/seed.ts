import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  PrismaClient,
  PlanTier,
  RoleScope,
  UserStatus,
  UserType,
} from "../lib/generated/prisma";

const prisma = new PrismaClient();

const DEFAULT_ROLES = [
  {
    name: "Super Admin",
    slug: "super-admin",
    priority: 100,
    isSystem: true,
    isDefault: false,
    description: "Full organization control",
  },
  {
    name: "Admin",
    slug: "admin",
    priority: 80,
    isSystem: true,
    isDefault: false,
    description: "Manage users and settings",
  },
  {
    name: "Moderator",
    slug: "moderator",
    priority: 60,
    isSystem: true,
    isDefault: false,
    description: "Moderate content",
  },
  {
    name: "Alumni",
    slug: "alumni",
    priority: 30,
    isSystem: true,
    isDefault: true,
    description: "Alumni member",
  },
  {
    name: "Student",
    slug: "student",
    priority: 20,
    isSystem: true,
    isDefault: true,
    description: "Student member",
  },
];

async function ensureOrgRoles(organizationId: string) {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: role.slug,
        },
      },
      update: {},
      create: {
        organizationId,
        ...role,
        scope: RoleScope.organization,
      },
    });
  }
}

async function main() {
  console.log("Seeding started...");

  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "admin@alumniconnect.com";
  const superAdminClerkId = process.env.SUPER_ADMIN_CLERK_ID || null;
  const normalizedEmail = superAdminEmail.toLowerCase();

  // 1. Default organization
  const org = await prisma.organization.upsert({
    where: { slug: "alumni-connect-univ" },
    update: {},
    create: {
      name: "Alumni Connect University",
      slug: "alumni-connect-univ",
      displayName: "Alumni Connect Academy",
      planTier: PlanTier.enterprise,
      isActive: true,
      isVerified: true,
    },
  });

  console.log("✔ Organization:", org.name);

  // 2. Default RBAC roles (required for onboarding role assignment)
  await ensureOrgRoles(org.id);
  console.log("✔ Default roles created");

  const superAdminRole = await prisma.role.findFirst({
    where: { organizationId: org.id, slug: "super-admin" },
  });

  // 3. Super admin user
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { emailNormalized: normalizedEmail },
        ...(superAdminClerkId
          ? [{ metadata: { path: ["clerkId"], equals: superAdminClerkId } }]
          : []),
      ],
    },
  });

  const admin =
    existingSuperAdmin ??
    (await prisma.user.create({
      data: {
        organizationId: org.id,
        email: superAdminEmail,
        emailNormalized: normalizedEmail,
        firstName: "Super",
        fullName: "Super Admin",
        status: UserStatus.active,
        userType: UserType.super_admin,
        emailVerified: true,
        metadata: {
          clerkId: superAdminClerkId || "pending_clerk_link",
          seeded: true,
        },
      },
    }));

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      organizationId: org.id,
      userType: UserType.super_admin,
      status: UserStatus.active,
      email: superAdminEmail,
      emailNormalized: normalizedEmail,
      metadata: {
        ...(typeof admin.metadata === "object" && admin.metadata !== null
          ? admin.metadata
          : {}),
        clerkId: superAdminClerkId || (admin.metadata as any)?.clerkId || "pending_clerk_link",
        seeded: true,
        onboardingCompleted: true,
      },
    },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: admin.id,
          roleId: superAdminRole.id,
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: superAdminRole.id,
        organizationId: org.id,
        grantedBy: admin.id,
        grantedReason: "Seed super admin",
      },
    });
  }

  console.log("✔ Super admin:", superAdminEmail);
  if (!superAdminClerkId) {
    console.log(
      "  → Set SUPER_ADMIN_CLERK_ID in .env after signing up, then re-run seed to link Clerk."
    );
  }

  // 4. Ensure common countries for sample data FKs
  for (const code of ["US", "IN"]) {
    await prisma.country.upsert({
      where: { code },
      update: {},
      create: { code, name: code, isActive: true },
    });
  }

  // 5. Sample jobs (optional — skip if lookup tables are incomplete)
  try {
    const jobCount = await prisma.jobPosting.count({
      where: { organizationId: org.id },
    });
    if (jobCount === 0) {
      await prisma.jobPosting.createMany({
        data: [
          {
            organizationId: org.id,
            postedBy: admin.id,
            title: "Senior Full Stack Engineer",
            slug: "senior-full-stack-engineer-google",
            companyName: "Google",
            locationCity: "Mountain View",
            locationCountry: "US",
            jobType: "full_time",
            experienceLevel: "senior",
            status: "active",
            description:
              "We are looking for an experienced full stack engineer to join our team.",
          },
        ],
      });
      console.log("✔ Sample jobs created");
    }
  } catch (e) {
    console.warn("⚠ Skipped sample jobs (lookup data may be missing)");
  }

  // 6. Sample events
  try {
    const eventCount = await prisma.event.count({
      where: { organizationId: org.id },
    });
    if (eventCount === 0) {
      await prisma.event.createMany({
        data: [
          {
            organizationId: org.id,
            organizerId: admin.id,
            title: "Alumni Meetup 2026",
            slug: "alumni-meetup-2026",
            description: "A chance to reconnect with your peers.",
            startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endsAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
            ),
            mode: "online",
            eventType: "networking",
            isPublished: true,
          },
        ],
      });
      console.log("✔ Sample events created");
    }
  } catch (e) {
    console.warn("⚠ Skipped sample events");
  }

  console.log("\nSeeding completed successfully!");
  console.log(`Organization slug: ${org.slug}`);
  console.log(`Super admin email: ${superAdminEmail}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
