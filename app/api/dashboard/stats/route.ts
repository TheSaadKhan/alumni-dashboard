// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { UserType, ConnectionStatus, JobStatus, InviteStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 1 minute

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const includeDetails = url.searchParams.get("includeDetails") === "true";
    const period = url.searchParams.get("period") || "month"; // week, month, year

    // Find user with profile data
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      include: {
        alumniProfile: true,
        studentProfile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Date ranges for trends
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    let compareDate: Date;
    let trendPeriod: string;
    
    switch (period) {
      case "week":
        compareDate = startOfWeek;
        trendPeriod = "week";
        break;
      case "year":
        compareDate = startOfYear;
        trendPeriod = "year";
        break;
      default:
        compareDate = startOfMonth;
        trendPeriod = "month";
    }

    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSuperAdmin = user.userType === UserType.super_admin;

    // Basic stats for all users
    const [
      // Connections
      totalConnections,
      pendingConnections,
      newConnectionsThisPeriod,
      
      // Mentorship
      mentorshipRequestsSent,
      mentorshipRequestsReceived,
      activeMentorships,
      completedMentorships,
      
      // Jobs
      jobApplications,
      jobApplicationsThisPeriod,
      savedJobs,
      interviewsReceived,
      
      // Events
      registeredEvents,
      upcomingEvents,
      pastEventsAttended,
      eventCheckIns,
      
      // Content
      postsCreated,
      postsCreatedThisPeriod,
      commentsWritten,
      reactionsGiven,
      
      // Notifications
      unreadNotifications,
      totalNotifications,
      
      // Achievements/Badges (if you have them)
      profileViews,
      profileCompleteness,
    ] = await Promise.all([
      // Total accepted connections
      prisma.connection.count({
        where: {
          OR: [
            { requesterId: user.id, status: ConnectionStatus.accepted },
            { recipientId: user.id, status: ConnectionStatus.accepted },
          ],
        },
      }),
      
      // Pending connection requests
      prisma.connection.count({
        where: {
          recipientId: user.id,
          status: ConnectionStatus.pending,
        },
      }),
      
      // New connections this period
      prisma.connection.count({
        where: {
          OR: [
            { requesterId: user.id, status: ConnectionStatus.accepted },
            { recipientId: user.id, status: ConnectionStatus.accepted },
          ],
          acceptedAt: { gte: compareDate },
        },
      }),
      
      // Mentorship requests sent
      prisma.mentorshipRequest.count({
        where: { studentId: user.id },
      }),
      
      // Mentorship requests received
      prisma.mentorshipRequest.count({
        where: { alumniId: user.id },
      }),
      
      // Active mentorships
      prisma.mentorshipRequest.count({
        where: {
          OR: [
            { studentId: user.id, status: "accepted" },
            { alumniId: user.id, status: "accepted" },
          ],
          expiresAt: { gt: now },
        },
      }),
      
      // Completed mentorships
      prisma.mentorshipRequest.count({
        where: {
          OR: [
            { studentId: user.id, status: "completed" },
            { alumniId: user.id, status: "completed" },
          ],
        },
      }),
      
      // Job applications submitted
      prisma.jobApplication.count({
        where: { applicantId: user.id },
      }),
      
      // Job applications this period
      prisma.jobApplication.count({
        where: {
          applicantId: user.id,
          createdAt: { gte: compareDate },
        },
      }),
      
      // Saved/bookmarked jobs
      prisma.jobBookmark.count({
        where: { userId: user.id },
      }),
      
      // Interviews (applications in interview stage)
      prisma.jobApplication.count({
        where: {
          applicantId: user.id,
          status: "interview_scheduled",
        },
      }),
      
      // Events user is registered for
      prisma.eventRegistration.count({
        where: {
          userId: user.id,
          status: { in: ["registered", "approved", "attended"] },
        },
      }),
      
      // Upcoming registered events
      prisma.eventRegistration.count({
        where: {
          userId: user.id,
          status: { in: ["registered", "approved"] },
          event: {
            startsAt: { gt: now },
          },
        },
      }),
      
      // Past events attended
      prisma.eventRegistration.count({
        where: {
          userId: user.id,
          status: "attended",
          event: {
            endsAt: { lt: now },
          },
        },
      }),
      
      // Event check-ins
      prisma.eventRegistration.count({
        where: {
          userId: user.id,
          checkedInAt: { not: null },
        },
      }),
      
      // Posts created
      prisma.post.count({
        where: { authorId: user.id, deletedAt: null },
      }),
      
      // Posts created this period
      prisma.post.count({
        where: {
          authorId: user.id,
          deletedAt: null,
          createdAt: { gte: compareDate },
        },
      }),
      
      // Comments written
      prisma.postComment.count({
        where: { authorId: user.id, isDeleted: false },
      }),
      
      // Reactions given
      prisma.reaction.count({
        where: { userId: user.id },
      }),
      
      // Unread notifications
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      }),
      
      // Total notifications
      prisma.notification.count({
        where: { userId: user.id },
      }),
      
      // Profile views (from alumni/student profile)
      user.alumniProfile 
        ? Promise.resolve(user.alumniProfile.viewCount)
        : user.studentProfile 
          ? Promise.resolve(user.studentProfile.viewCount)
          : Promise.resolve(0),
      
      // Profile completeness
      user.alumniProfile 
        ? Promise.resolve(user.alumniProfile.profileCompleteness)
        : user.studentProfile 
          ? Promise.resolve(user.studentProfile.profileCompleteness)
          : Promise.resolve(0),
    ]);

    // Admin/Organization stats (only for admins)
    let organizationStats = null;
    if (isAdmin || isSuperAdmin) {
      const orgId = user.organizationId;
      if (orgId) {
        const [
          totalOrgMembers,
          activeOrgMembers,
          totalOrgEvents,
          totalOrgJobs,
          totalOrgPosts,
          pendingInvitations,
          totalMentorships,
          engagementRate,
        ] = await Promise.all([
          // Total organization members
          prisma.user.count({
            where: {
              organizationId: orgId,
              status: "active",
              deletedAt: null,
            },
          }),
          
          // Active members (last 30 days)
          prisma.user.count({
            where: {
              organizationId: orgId,
              status: "active",
              deletedAt: null,
              lastSeenAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          }),
          
          // Total events
          prisma.event.count({
            where: {
              organizationId: orgId,
              deletedAt: null,
            },
          }),
          
          // Active jobs
          prisma.jobPosting.count({
            where: {
              organizationId: orgId,
              status: JobStatus.active,
              deletedAt: null,
              expiresAt: { gt: now },
            },
          }),
          
          // Total posts
          prisma.post.count({
            where: {
              organizationId: orgId,
              deletedAt: null,
            },
          }),
          
          // Pending invitations
          prisma.orgInvitation.count({
            where: {
              organizationId: orgId,
              status: InviteStatus.pending,
              expiresAt: { gt: now },
            },
          }),
          
          // Active mentorships
          prisma.mentorshipRequest.count({
            where: {
              organizationId: orgId,
              status: "accepted",
              expiresAt: { gt: now },
            },
          }),
          
          // Engagement rate calculation
          prisma.$queryRaw`SELECT 
            ROUND(
              (COUNT(DISTINCT CASE WHEN last_seen_at > NOW() - INTERVAL '30 days' THEN id END)::float / 
              NULLIF(COUNT(DISTINCT CASE WHEN status = 'active' THEN id END), 0) * 100
            )::numeric, 1
          ) as rate
          FROM users 
          WHERE organization_id = ${orgId} AND deleted_at IS NULL`
            .then((result: any) => Number(result[0]?.rate || 0)),
        ]);

        organizationStats = {
          totalMembers: totalOrgMembers,
          activeMembers: activeOrgMembers,
          totalEvents: totalOrgEvents,
          activeJobs: totalOrgJobs,
          totalPosts: totalOrgPosts,
          pendingInvitations,
          activeMentorships: totalMentorships,
          engagementRate,
          memberGrowth: await calculateGrowthRate(orgId),
        };
      }
    }

    // Calculate trends
    const previousPeriodStart = new Date(compareDate);
    previousPeriodStart.setDate(compareDate.getDate() - (period === "week" ? 7 : period === "month" ? 30 : 365));
    
    const previousConnections = await prisma.connection.count({
      where: {
        OR: [
          { requesterId: user.id, status: ConnectionStatus.accepted },
          { recipientId: user.id, status: ConnectionStatus.accepted },
        ],
        acceptedAt: {
          gte: previousPeriodStart,
          lt: compareDate,
        },
      },
    });

    const connectionTrend = previousConnections > 0
      ? ((newConnectionsThisPeriod - previousConnections) / previousConnections) * 100
      : newConnectionsThisPeriod > 0 ? 100 : 0;

    const responseData: any = {
      stats: {
        // Network stats
        network: {
          total: totalConnections,
          pending: pendingConnections,
          newThisPeriod: newConnectionsThisPeriod,
          trend: Math.round(connectionTrend),
        },
        
        // Mentorship stats
        mentorship: {
          requestsSent: mentorshipRequestsSent,
          requestsReceived: mentorshipRequestsReceived,
          active: activeMentorships,
          completed: completedMentorships,
        },
        
        // Career stats
        career: {
          applications: jobApplications,
          applicationsThisPeriod: jobApplicationsThisPeriod,
          savedJobs,
          interviews: interviewsReceived,
        },
        
        // Events stats
        events: {
          registered: registeredEvents,
          upcoming: upcomingEvents,
          attended: pastEventsAttended,
          checkIns: eventCheckIns,
        },
        
        // Content stats
        content: {
          posts: postsCreated,
          postsThisPeriod: postsCreatedThisPeriod,
          comments: commentsWritten,
          reactions: reactionsGiven,
        },
        
        // Notification stats
        notifications: {
          unread: unreadNotifications,
          total: totalNotifications,
        },
        
        // Profile stats
        profile: {
          views: profileViews,
          completeness: profileCompleteness,
        },
      },
      period: trendPeriod,
    };

    // Add organization stats for admins
    if (organizationStats) {
      responseData.organization = organizationStats;
    }

    // Add detailed stats if requested
    if (includeDetails) {
      const [
        recentConnections,
        recentApplications,
        upcomingRegisteredEvents,
        recentNotifications,
      ] = await Promise.all([
        // Recent connections
        prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: user.id, status: ConnectionStatus.accepted },
              { recipientId: user.id, status: ConnectionStatus.accepted },
            ],
          },
          include: {
            requester: {
              select: { fullName: true, avatarUrl: true },
            },
            recipient: {
              select: { fullName: true, avatarUrl: true },
            },
          },
          orderBy: { acceptedAt: "desc" },
          take: 5,
        }),
        
        // Recent job applications
        prisma.jobApplication.findMany({
          where: { applicantId: user.id },
          include: {
            jobPosting: {
              select: { title: true, companyName: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        
        // Upcoming registered events with details
        prisma.eventRegistration.findMany({
          where: {
            userId: user.id,
            status: { in: ["registered", "approved"] },
            event: {
              startsAt: { gt: now },
            },
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startsAt: true,
                locationName: true,
                mode: true,
              },
            },
          },
          orderBy: {
            event: {
              startsAt: "asc",
            },
          },
          take: 5,
        }),
        
        // Recent unread notifications
        prisma.notification.findMany({
          where: {
            userId: user.id,
            isRead: false,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);
      
      responseData.details = {
        recentConnections,
        recentApplications,
        upcomingEvents: upcomingRegisteredEvents,
        recentNotifications,
      };
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard statistics",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate organization growth rate
async function calculateGrowthRate(organizationId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  
  const [newMembersLast30Days, newMembersPrevious30Days] = await Promise.all([
    prisma.user.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        organizationId,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
        deletedAt: null,
      },
    }),
  ]);
  
  if (newMembersPrevious30Days === 0) {
    return newMembersLast30Days > 0 ? 100 : 0;
  }
  
  return Math.round(((newMembersLast30Days - newMembersPrevious30Days) / newMembersPrevious30Days) * 100);
}