// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify admin access
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    const role = membership.organization_roles;
    const isAdmin =
      role.name === "super_admin" ||
      role.name === "admin" ||
      role.permissions?.manage_org ||
      role.permissions?.manage_members;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get stats
    const [
      totalUsers,
      newUsersThisMonth,
      activeEvents,
      pendingJobs,
      totalDonations,
      donationsThisMonth,
    ] = await Promise.all([
      // Total users in organization
      prisma.organization_members.count({
        where: {
          organization_id: organizationId,
          is_active: true,
        },
      }),

      // New users this month
      prisma.organization_members.count({
        where: {
          organization_id: organizationId,
          is_active: true,
          created_at: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
          },
        },
      }),

      // Active events
      prisma.events.count({
        where: {
          organization_id: organizationId,
          status: "published",
          starts_at: {
            gte: new Date(),
          },
        },
      }),

      // Pending jobs
      prisma.jobs.count({
        where: {
          organization_id: organizationId,
          status: "draft",
        },
      }),

      // Total donations (completed)
      prisma.donations.aggregate({
        where: {
          organization_id: organizationId,
          status: "completed",
        },
        _sum: {
          amount: true,
        },
      }),

      // Donations this month
      prisma.donations.aggregate({
        where: {
          organization_id: organizationId,
          status: "completed",
          created_at: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate growth rate (simplified)
    const lastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );
    const lastMonthUsers = await prisma.organization_members.count({
      where: {
        organization_id: organizationId,
        is_active: true,
        created_at: {
          gte: lastMonth,
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const growthRate =
      lastMonthUsers > 0
        ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100
        : 0;

    return NextResponse.json({
      totalUsers,
      newUsers: newUsersThisMonth,
      activeEvents,
      pendingJobs,
      totalDonations: totalDonations._sum.amount || 0,
      donationsThisMonth: donationsThisMonth._sum.amount || 0,
      growthRate: Math.round(growthRate * 10) / 10,
    });
  } catch (err: any) {
    console.error("Admin stats GET failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

