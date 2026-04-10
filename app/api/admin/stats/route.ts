// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, JobStatus, InviteStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
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

    // Find user by Clerk ID
    const user = await prisma.user.findFirst({
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is super admin globally
    const isGlobalSuperAdmin = user.userType === UserType.super_admin;

    // Get user's roles in the organization
    const userRoles = await prisma.userRole.findMany({
      where: {
        organizationId,
        userId: user.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
      },
      include: {
        role: true,
      },
    });

    // Check if user has admin access
    const hasAdminRole = userRoles.some(
      (ur) => ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (!isGlobalSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      // User stats
      totalUsers,
      newUsersThisMonth,
      usersByType,
      activeUsers,
      pendingInvitations,
      
      // Event stats
      totalEvents,
      upcomingEvents,
      pastEventsThisMonth,
      eventRegistrations,
      
      // Job stats
      totalJobs,
      activeJobs,
      pendingJobs,
      filledJobs,
      totalApplications,
      
      // Mentorship stats
      totalMentorshipRequests,
      activeMentorships,
      completedMentorships,
      
      // Content stats
      totalPosts,
      postsThisMonth,
      totalComments,
      commentsThisMonth,
      
      // Connection stats
      totalConnections,
      newConnectionsThisMonth,
      
      // Donation stats (if you have a donations model)
      // If not, these will be 0
      totalDonations,
      donationsThisMonth,
      
      // Growth calculations
      lastMonthNewUsers,
    ] = await Promise.all([
      // Total active users
      prisma.user.count({
        where: {
          organizationId,
          status: "active",
          deletedAt: null,
        },
      }),

      // New users this month
      prisma.user.count({
        where: {
          organizationId,
          status: "active",
          deletedAt: null,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Users by type
      prisma.user.groupBy({
        by: ["userType"],
        where: {
          organizationId,
          status: "active",
          deletedAt: null,
        },
        _count: true,
      }),

      // Active users (last 30 days)
      prisma.user.count({
        where: {
          organizationId,
          status: "active",
          deletedAt: null,
          lastSeenAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),

      // Pending invitations
      prisma.orgInvitation.count({
        where: {
          organizationId,
          status: InviteStatus.pending,
          expiresAt: {
            gt: now,
          },
        },
      }),

      // Total events (all time)
      prisma.event.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),

      // Upcoming events
      prisma.event.count({
        where: {
          organizationId,
          deletedAt: null,
          cancelledAt: null,
          isPublished: true,
          startsAt: {
            gt: now,
          },
        },
      }),

      // Past events this month
      prisma.event.count({
        where: {
          organizationId,
          deletedAt: null,
          cancelledAt: null,
          endsAt: {
            gte: startOfMonth,
            lt: now,
          },
        },
      }),

      // Total event registrations
      prisma.eventRegistration.count({
        where: {
          organizationId,
          status: {
            in: ["registered", "approved", "attended"],
          },
        },
      }),

      // Total jobs
      prisma.jobPosting.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),

      // Active jobs
      prisma.jobPosting.count({
        where: {
          organizationId,
          status: JobStatus.active,
          deletedAt: null,
          expiresAt: {
            gt: now,
          },
        },
      }),

      // Pending/draft jobs
      prisma.jobPosting.count({
        where: {
          organizationId,
          status: JobStatus.draft,
          deletedAt: null,
        },
      }),

      // Filled jobs
      prisma.jobPosting.count({
        where: {
          organizationId,
          status: JobStatus.filled,
          deletedAt: null,
        },
      }),

      // Total job applications
      prisma.jobApplication.count({
        where: {
          organizationId,
          status: {
            notIn: ["withdrawn"],
          },
        },
      }),

      // Total mentorship requests
      prisma.mentorshipRequest.count({
        where: {
          organizationId,
        },
      }),

      // Active mentorships
      prisma.mentorshipRequest.count({
        where: {
          organizationId,
          status: "accepted",
          expiresAt: {
            gt: now,
          },
        },
      }),

      // Completed mentorships
      prisma.mentorshipRequest.count({
        where: {
          organizationId,
          status: "completed",
        },
      }),

      // Total posts
      prisma.post.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),

      // Posts this month
      prisma.post.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Total comments
      prisma.postComment.count({
        where: {
          organizationId,
          isDeleted: false,
        },
      }),

      // Comments this month
      prisma.postComment.count({
        where: {
          organizationId,
          isDeleted: false,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Total connections
      prisma.connection.count({
        where: {
          organizationId,
          status: "accepted",
        },
      }),

      // New connections this month
      prisma.connection.count({
        where: {
          organizationId,
          status: "accepted",
          acceptedAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Donations (if you have a Donation model)
      // If not, these will be 0
      Promise.resolve(0),
      Promise.resolve(0),

      // Users from last month for growth calculation
      prisma.user.count({
        where: {
          organizationId,
          status: "active",
          deletedAt: null,
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
      }),
    ]);

    // Calculate growth rate
    const growthRate =
      lastMonthNewUsers > 0
        ? ((newUsersThisMonth - lastMonthNewUsers) / lastMonthNewUsers) * 100
        : newUsersThisMonth > 0
        ? 100
        : 0;

    // Calculate engagement rate
    const engagementRate = totalUsers > 0 
      ? (activeUsers / totalUsers) * 100 
      : 0;

    // Calculate event attendance rate
    const eventAttendanceRate = eventRegistrations > 0 && totalEvents > 0
      ? (eventRegistrations / totalEvents) * 100
      : 0;

    // Transform users by type
    const usersByTypeMap = usersByType.reduce((acc, curr) => {
      acc[curr.userType] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Get top performing jobs
    const topJobs = await prisma.jobPosting.findMany({
      where: {
        organizationId,
        status: JobStatus.active,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        applicationCount: true,
        viewCount: true,
      },
      orderBy: {
        applicationCount: "desc",
      },
      take: 5,
    });

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityLabel: true,
        createdAt: true,
        actor: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      stats: {
        // User metrics
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          activeLast30Days: activeUsers,
          pendingInvitations,
          growthRate: Math.round(growthRate * 10) / 10,
          engagementRate: Math.round(engagementRate),
          byType: {
            alumni: usersByTypeMap.alumni || 0,
            student: usersByTypeMap.student || 0,
            admin: usersByTypeMap.admin || 0,
            super_admin: usersByTypeMap.super_admin || 0,
          },
        },

        // Event metrics
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          pastThisMonth: pastEventsThisMonth,
          totalRegistrations: eventRegistrations,
          attendanceRate: Math.round(eventAttendanceRate),
        },

        // Job metrics
        jobs: {
          total: totalJobs,
          active: activeJobs,
          pending: pendingJobs,
          filled: filledJobs,
          totalApplications,
          topJobs: topJobs.map(job => ({
            id: job.id,
            title: job.title,
            applications: job.applicationCount,
            views: job.viewCount,
          })),
        },

        // Mentorship metrics
        mentorship: {
          totalRequests: totalMentorshipRequests,
          active: activeMentorships,
          completed: completedMentorships,
          completionRate: totalMentorshipRequests > 0
            ? Math.round((completedMentorships / totalMentorshipRequests) * 100)
            : 0,
        },

        // Content metrics
        content: {
          totalPosts,
          postsThisMonth,
          totalComments,
          commentsThisMonth,
          avgCommentsPerPost: totalPosts > 0
            ? Math.round((totalComments / totalPosts) * 10) / 10
            : 0,
        },

        // Connection metrics
        connections: {
          total: totalConnections,
          newThisMonth: newConnectionsThisMonth,
          avgConnectionsPerUser: totalUsers > 0
            ? Math.round((totalConnections / totalUsers) * 10) / 10
            : 0,
        },

        // Financial metrics (placeholder for now)
        financial: {
          totalDonations,
          donationsThisMonth,
          averageDonation: totalDonations > 0
            ? totalDonations / totalDonations // This would need proper donation tracking
            : 0,
        },

        // Recent activity
        recentActivity,
      },
    });
  } catch (err: any) {
    console.error("Admin stats API error:", err);
    return NextResponse.json(
      { 
        error: "Failed to fetch admin statistics",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}