import { PrismaClient, PlanTier } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Create default organization
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

  console.log("✔ Organization Created:", org.name);

  // 2. Create System Admin
  const admin = await prisma.user.upsert({
    where: { 
      id: "00000000-0000-0000-0000-000000000000" // Hardcoded UUID for system admin
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000000",
      organizationId: org.id,
      email: "system@alumniconnect.com",
      emailNormalized: "system@alumniconnect.com",
      firstName: "System",
      fullName: "System Admin",
      status: "active",
      userType: "super_admin",
      emailVerified: true,
      metadata: { clerkId: "system_admin" },
    },
  });

  console.log("✔ System Admin Created");

  // 3. Create some sample jobs
  const jobCount = await prisma.jobPosting.count();
  if (jobCount === 0) {
    await prisma.jobPosting.createMany({
      data: [
        {
          organizationId: org.id,
          postedBy: admin.id,
          title: "Senior Full Stack Engineer",
          slug: "senior-full-stack-engineer-google",
          companyName: "Google",
          companyLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
          locationCity: "Mountain View",
          locationCountry: "US",
          jobType: "full_time",
          experienceLevel: "senior",
          status: "active",
          description: "We are looking for an experienced full stack engineer to join our team.",
        },
        {
          organizationId: org.id,
          postedBy: admin.id,
          title: "Product Designer",
          slug: "product-designer-meta",
          companyName: "Meta",
          companyLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
          locationCity: "Remote",
          jobType: "full_time",
          experienceLevel: "mid",
          status: "active",
          description: "Help us design the future of connection.",
        }
      ],
    });
    console.log("✔ Sample Jobs Created");
  }

  // 4. Create some sample events
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({
      data: [
        {
          organizationId: org.id,
          organizerId: admin.id,
          title: "Alumni Meetup 2026",
          slug: "alumni-meetup-2026",
          description: "A chance to reconnect with your peers.",
          startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          mode: "online",
          eventType: "networking",
        }
      ],
    });
    console.log("✔ Sample Events Created");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

