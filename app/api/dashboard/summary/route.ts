// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 1 minute

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const includeActivity = url.searchParams.get("includeActivity") === "true";
    const includeNotifications = url.searchParams.get("includeNotifications") === "true";

    // Fetch user with comprehensive profile data
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            planTier: true,
            isVerified: true,
          },
        },
        alumniProfile: {
          include: {
            workHistory: {
              orderBy: { startedAt: "desc" },
              take: 2,
            },
          },
        },

        studentProfile: true,
        userRoles: {
          where: {
            revokedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's role names
    const userRoles = user.userRoles.map(ur => ur.role.name);
    const isAdmin = userRoles.some(role => 
      role.toLowerCase().includes("admin") || role.toLowerCase().includes("super")
    );

    // Get profile data based on user type
    const profile: any = user.userType === UserType.alumni ? user.alumniProfile : user.studentProfile;
    const profileSkills = await prisma.profileSkill.findMany({
      where: { ownerId: user.id },
      include: { skill: true }
    });
    const skills = profileSkills.map(ps => ({
      id: ps.skill.id,
      name: ps.skill.name,
      proficiencyLevel: ps.proficiencyLevel,
    }));

    // Get recent activity if requested
    let recentActivity = null;
    if (includeActivity) {
      const [recentPosts, recentComments, recentConnections] = await Promise.all([
        // Recent posts by user
        prisma.post.findMany({
          where: { authorId: user.id, deletedAt: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            reactionCount: true,
            commentCount: true,
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        
        // Recent comments by user
        prisma.postComment.findMany({
          where: { authorId: user.id, isDeleted: false },
          select: {
            id: true,
            content: true,
            createdAt: true,
            post: {
              select: {
                id: true,
                content: true,
                author: {
                  select: { fullName: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        
        // Recent connections
        prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: user.id, status: ConnectionStatus.accepted },
              { recipientId: user.id, status: ConnectionStatus.accepted },
            ],
          },
          select: {
            id: true,
            acceptedAt: true,
            requesterId: true,
            requester: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
            recipient: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { acceptedAt: "desc" },
          take: 3,
        }),
      ]);

      recentActivity = {
        posts: recentPosts.map(post => ({
          ...post,
          content: post.content.substring(0, 150) + (post.content.length > 150 ? "..." : ""),
        })),
        comments: recentComments,
        connections: recentConnections.map(conn => ({
          id: conn.id,
          user: conn.requesterId === user.id ? conn.recipient : conn.requester,
          connectedAt: conn.acceptedAt,
        })),
      };
    }

    // Get recent notifications if requested
    let recentNotifications = null;
    if (includeNotifications) {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        select: {
          id: true,
          title: true,
          body: true,
          type: true,
          category: true,
          actionUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      recentNotifications = notifications;
    }

    // Get upcoming events the user is registered for
    const upcomingEvents = await prisma.eventRegistration.findMany({
      where: {
        userId: user.id,
        status: { in: ["registered", "approved"] },
        event: {
          startsAt: { gt: new Date() },
          deletedAt: null,
        },
      },
      select: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
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
      take: 3,
    });

    // Get pending connection requests
    const pendingRequests = await prisma.connection.count({
      where: {
        recipientId: user.id,
        status: ConnectionStatus.pending,
      },
    });

    // Get unread messages count
    const unreadMessages = await prisma.messageRead.count({
      where: {
        userId: user.id,
        readAt: null as any,
      },
    });

    // Prepare response
    const responseData: any = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        status: user.status,
        roles: userRoles,
        isAdmin,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
      },
      organization: user.organization,
      profile: {
        type: user.userType,
        headline: profile?.headline || null,
        bio: profile?.bio || null,
        location: {
          city: profile?.city || null,
          countryCode: profile?.countryCode || null,
        },
        skills,
        isVerified: profile?.isVerified || false,
        profileCompleteness: profile?.profileCompleteness || 0,
        viewCount: profile?.viewCount || 0,
      },
      stats: {
        pendingConnectionRequests: pendingRequests,
        unreadMessages,
        upcomingEventsCount: upcomingEvents.length,
      },
      upcomingEvents: upcomingEvents.map(reg => ({
        id: reg.event.id,
        title: reg.event.title,
        slug: reg.event.slug,
        startsAt: reg.event.startsAt,
        location: reg.event.mode === "online" ? "Online" : (reg.event.locationName || "TBD"),
      })),
    };

    // Add activity if requested
    if (recentActivity) {
      responseData.recentActivity = recentActivity;
    }

    // Add notifications if requested
    if (recentNotifications) {
      responseData.notifications = {
        unreadCount: recentNotifications.length,
        items: recentNotifications,
      };
    }

    // Add alumni-specific data
    if (user.userType === UserType.alumni && user.alumniProfile) {
      responseData.alumniData = {
        currentCompany: user.alumniProfile.currentCompany,
        currentTitle: user.alumniProfile.currentTitle,
        industry: user.alumniProfile.industry,
        graduationYear: user.alumniProfile.graduationYear,
        degree: user.alumniProfile.degree,
        major: user.alumniProfile.major,
        isOpenToWork: user.alumniProfile.isOpenToWork,
        isMentorAvailable: user.alumniProfile.isMentorAvailable,
        workHistory: user.alumniProfile.workHistory,
      };
    }

    // Add student-specific data
    if (user.userType === UserType.student && user.studentProfile) {
      responseData.studentData = {
        major: user.studentProfile.major,
        minor: user.studentProfile.minor,
        enrollmentYear: user.studentProfile.enrollmentYear,
        expectedGraduation: user.studentProfile.expectedGraduation,
        isSeekingMentorship: user.studentProfile.isSeekingMentorship,
        isSeekingInternship: user.studentProfile.isSeekingInternship,
        isSeekingFulltime: user.studentProfile.isSeekingFulltime,
      };
    }

    // Add welcome message for new users or based on time of day
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";
    
    responseData.greeting = `${greeting}, ${user.firstName || user.fullName.split(' ')[0]}!`;
    
    // Add tips based on profile completeness
    if ((profile?.profileCompleteness || 0) < 50) {
      responseData.tip = {
        message: "Complete your profile to get better connections and opportunities",
        action: "/dashboard/profile/edit",
      };
    } else if (skills.length === 0) {
      responseData.tip = {
        message: "Add your skills to help us match you with relevant jobs and mentors",
        action: "/dashboard/profile/edit#skills",
      };
    } else if (user.userType === UserType.student && !profile?.isSeekingMentorship) {
      responseData.tip = {
        message: "Enable mentorship to connect with experienced alumni who can guide your career",
        action: "/dashboard/profile/edit#mentorship",
      };
    } else if (user.userType === UserType.alumni && !profile?.isMentorAvailable && (profile?.yearsOfExperience || 0) > 2) {
      responseData.tip = {
        message: "Share your experience as a mentor and help shape the next generation of professionals",
        action: "/dashboard/profile/edit#mentorship",
      };
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard summary",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}