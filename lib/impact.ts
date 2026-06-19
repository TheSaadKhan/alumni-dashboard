import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/lib/generated/prisma";

async function resolveOrgId(organizationId: string | null) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { metadata: { path: ["clerkId"], equals: clerkId } },
    select: { id: true, organizationId: true },
  });

  if (!user) throw new Error("User not found");

  const targetOrgId = organizationId || user.organizationId;
  if (!targetOrgId) throw new Error("Organization required");

  return targetOrgId;
}

export async function getImpactStats(organizationId: string | null) {
  const orgId = await resolveOrgId(organizationId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });

  const settings = (org?.settings as Record<string, unknown>) || {};
  const donationGoal = Number(settings.donationGoal) || 100000;

  const [
    donationAgg,
    donorCount,
    studentsSupported,
    mentorshipHours,
    eventsHosted,
    volunteers,
  ] = await Promise.all([
    prisma.donation.aggregate({
      where: { organizationId: orgId, status: PaymentStatus.paid },
      _sum: { amount: true },
    }),
    prisma.donation.groupBy({
      by: ["userId"],
      where: { organizationId: orgId, status: PaymentStatus.paid, userId: { not: null } },
    }),
    prisma.studentProfile.count({ where: { organizationId: orgId, isVerified: true } }),
    prisma.mentorshipRequest.count({
      where: { organizationId: orgId, status: "accepted" },
    }),
    prisma.event.count({
      where: { organizationId: orgId, deletedAt: null, cancelledAt: null, isPublished: true },
    }),
    prisma.user.count({
      where: {
        organizationId: orgId,
        status: "active",
        deletedAt: null,
        OR: [
          { alumniProfile: { isMentorAvailable: true } },
          { donations: { some: { status: PaymentStatus.paid } } },
        ],
      },
    }),
  ]);

  const totalDonations = Number(donationAgg._sum.amount || 0);

  return {
    totalDonations,
    donationGoal,
    studentsSupported,
    mentorshipHours: mentorshipHours * 4,
    eventsHosted,
    volunteers,
  };
}

export async function getImpactInitiatives(organizationId: string | null) {
  const orgId = await resolveOrgId(organizationId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, settings: true },
  });

  const settings = (org?.settings as Record<string, unknown>) || {};
  const defaultGoal = Number(settings.donationGoal) || 100000;

  const [totalAgg, scholarshipAgg, donorGroups] = await Promise.all([
    prisma.donation.aggregate({
      where: { organizationId: orgId, status: PaymentStatus.paid },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: {
        organizationId: orgId,
        status: PaymentStatus.paid,
        message: { contains: "scholarship", mode: "insensitive" },
      },
      _sum: { amount: true },
    }),
    prisma.donation.groupBy({
      by: ["userId"],
      where: { organizationId: orgId, status: PaymentStatus.paid },
    }),
  ]);

  const total = Number(totalAgg._sum.amount || 0);
  const scholarship = Number(scholarshipAgg._sum.amount || 0);
  const general = Math.max(0, total - scholarship);

  const build = (
    id: string,
    title: string,
    description: string,
    category: string,
    raised: number,
    goal: number,
    donors: number
  ) => ({
    id,
    title,
    description,
    category,
    raised,
    goal,
    progress: goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0,
    donors,
  });

  return [
    build(
      "general-fund",
      `${org?.name || "Alumni"} General Fund`,
      "Supporting programs, infrastructure, and community initiatives.",
      "general",
      general,
      defaultGoal,
      donorGroups.length
    ),
    build(
      "scholarship-fund",
      "Scholarship & Student Support",
      "Funding scholarships and student success programs.",
      "scholarship",
      scholarship,
      defaultGoal * 0.4,
      Math.ceil(donorGroups.length * 0.6)
    ),
  ];
}

export async function getImpactContributors(organizationId: string | null) {
  const orgId = await resolveOrgId(organizationId);

  const donations = await prisma.donation.findMany({
    where: { organizationId: orgId, status: PaymentStatus.paid },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          alumniProfile: { select: { graduationYear: true } },
        },
      },
    },
    orderBy: { amount: "desc" },
    take: 50,
  });

  const byUser = new Map<
    string,
    { id: string; name: string; amount: number; batch: number | null; isAnonymous: boolean }
  >();

  for (const d of donations) {
    const key = d.isAnonymous ? `anon-${d.id}` : d.userId || d.id;
    const existing = byUser.get(key);
    const amount = Number(d.amount);
    if (existing) {
      existing.amount += amount;
    } else {
      byUser.set(key, {
        id: key,
        name: d.isAnonymous ? "Anonymous Donor" : d.user?.fullName || "Anonymous Donor",
        amount,
        batch: d.user?.alumniProfile?.graduationYear ?? null,
        isAnonymous: d.isAnonymous,
      });
    }
  }

  return Array.from(byUser.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

export async function getImpactStories(organizationId: string | null) {
  const orgId = await resolveOrgId(organizationId);

  const [posts, announcements] = await Promise.all([
    prisma.post.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        postType: { in: ["achievement", "general"] },
      },
      select: {
        id: true,
        content: true,
        postType: true,
        createdAt: true,
        author: { select: { fullName: true, userType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.announcement.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        publishAt: { lte: new Date() },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { fullName: true } },
      },
      orderBy: { publishAt: "desc" },
      take: 3,
    }),
  ]);

  const fromPosts = posts.map((p) => ({
    id: p.id,
    title: p.content.slice(0, 60) + (p.content.length > 60 ? "..." : ""),
    content: p.content,
    category: p.postType === "achievement" ? "scholarship" : "community",
    author: p.author.fullName || "Alumni",
    authorType: p.author.userType || "alumni",
  }));

  const fromAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    category: "community",
    author: a.author.fullName || "Admin",
    authorType: "admin",
  }));

  return [...fromAnnouncements, ...fromPosts].slice(0, 6);
}
