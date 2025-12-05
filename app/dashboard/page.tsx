import React from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

type Stats = {
  totalMembers: number;
  totalEvents: number;
  totalNews: number;
};

export default async function DashboardPage() {
  // -----------------------------
  // 1. AUTHENTICATION
  // -----------------------------
  const user = await currentUser();
  if (!user) redirect("/");

  const clerkEmail = user.emailAddresses[0]?.emailAddress || "";

  // -----------------------------
  // 2. LOAD OR CREATE PROFILE
  // -----------------------------
  let profile = await prisma.profiles.findFirst({
    where: {
      OR: [
        { auth_user_id: user.id },
        { email: clerkEmail }
      ]
    },
  });

  // Create missing profile automatically
  if (!profile) {
    profile = await prisma.profiles.create({
      data: {
        auth_user_id: user.id,
        email: clerkEmail,
        full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        avatar_url: user.imageUrl,
        is_active: true,
        degree: "",
        metadata: {},
        skills: {},
      },
    });

    // User must complete additional fields
    redirect("/auth/complete-profile");
  }

  // Check if profile is complete (has degree and major)
  const metadata = (profile.metadata as any) || {};
  const isProfileComplete =
    profile.degree && profile.degree.trim() !== "" && metadata.major;

  // If profile incomplete, redirect to complete profile
  if (!isProfileComplete) {
    redirect("/auth/complete-profile");
  }

  // For super_admin: Check if organization is set up
  if (profile.user_type === "super_admin") {
    const hasOrganization = await prisma.organization_members.findFirst({
      where: {
        user_id: profile.id,
        is_active: true,
      },
    });

    // If no organization, redirect to setup
    if (!hasOrganization) {
      redirect("/setup-organization");
    }
  }

  // Sync latest Clerk info into DB
  if (profile.auth_user_id !== user.id || profile.email !== clerkEmail) {
    await prisma.profiles.update({
      where: { id: profile.id },
      data: {
        auth_user_id: user.id,
        email: clerkEmail,
        full_name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          profile.full_name,
        avatar_url: user.imageUrl || profile.avatar_url,
      },
    });
  }

  // -----------------------------
  // 3. LOAD ORGANIZATION MEMBERSHIPS
  // -----------------------------
  const memberships = await prisma.organization_members.findMany({
    where: { user_id: profile.id },
    include: {
      organizations: true, // correct relation
      organization_roles: { // correct relation
        select: {
          id: true,
          name: true,
          display_name: true,
          hierarchy_level: true,
          permissions: true,
        },
      },
    },
  });

  // -----------------------------
  // 4. MAP ORGS DISPLAY MODEL
  // -----------------------------
  const organizations = memberships.map((m) => ({
    id: m.organizations.id,
    name: m.organizations.name,
    slug: m.organizations.slug,
    role: m.organization_roles,
    memberId: m.id,
  }));

  // -----------------------------
  // 5. DETERMINE ACTIVE ORG
  // -----------------------------
  let activeOrg: any = null;

  if (organizations.length > 0) {
    // Prefer user primary organization if exists
    const preferred = organizations.find(
      (o) => o.id === profile.primary_organization_id
    );
    activeOrg = preferred || organizations[0];
  } else if (profile.primary_organization_id) {
    // Not a member, but profile references a primary org
    const org = await prisma.organizations.findUnique({
      where: { id: profile.primary_organization_id },
    });
    if (org) {
      activeOrg = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: null,
        memberId: null,
      };
    }
  }

  // -----------------------------
  // 6. DETERMINE ACTIVE ROLE
  // -----------------------------
  let activeRole = null;

  if (activeOrg?.memberId) {
    const mem = memberships.find((m) => m.id === activeOrg.memberId);
    activeRole = mem?.organization_roles ?? null;
  }

  // -----------------------------
  // 7. LOAD ORG STATS
  // -----------------------------
  const stats: Stats = {
    totalMembers: 0,
    totalEvents: 0,
    totalNews: 0,
  };

  if (activeOrg) {
    try {
      stats.totalMembers = await prisma.organization_members.count({
        where: {
          organization_id: activeOrg.id,
          is_active: true,
          membership_status: "active",
        },
      });

      stats.totalEvents = await prisma.events.count({
        where: { organization_id: activeOrg.id },
      });

      stats.totalNews = await prisma.stories.count({
        where: { organization_id: activeOrg.id, status: "published" },
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  }

  // -----------------------------
  // 8. RETURN CLIENT COMPONENT
  // -----------------------------
  return (
    <DashboardClient
      profile={profile}
      organizations={organizations}
      activeOrg={activeOrg}
      activeRole={activeRole}
      stats={stats}
    />
  );
}
