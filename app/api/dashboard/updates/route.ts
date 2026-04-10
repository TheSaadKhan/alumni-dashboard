// app/api/dashboard/activity/route.ts
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
    const organizationId = url.searchParams.get("organizationId");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const type = url.searchParams.get("type") || "all"; // all, connections, posts, events, jobs, mentorship

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        userType: true,
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

    const targetOrgId = organizationId || user.organizationId;
    if (!targetOrgId) {
      return NextResponse.json({ updates: [] });
    }

    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    const activities: any[] = [];

    // 1. New Member Joins
    if (type === "all" || type === "members") {
      const newMembers = await prisma.user.findMany({
        where: {
          organizationId: targetOrgId,
          status: "active",
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          avatarUrl: true,
          userType: true,
          createdAt: true,
          alumniProfile: {
            select: {
              graduationYear: true,
              currentCompany: true,
              currentTitle: true,
            },
          },
          studentProfile: {
            select: {
              expectedGraduation: true,
              major: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: type === "all" ? 5 : limit,
      });

      newMembers.forEach(member => {
        const graduationInfo = member.alumniProfile?.graduationYear 
          ? `Class of ${member.alumniProfile.graduationYear}`
          : member.studentProfile?.expectedGraduation 
            ? `Class of ${member.studentProfile.expectedGraduation}`
            : null;
        
        const roleInfo = member.userType === "alumni" 
          ? (member.alumniProfile?.currentTitle || "Alumni")
          : "Student";

        activities.push({
          id: `member-${member.id}`,
          type: "member_joined",
          actor: {
            id: member.id,
            name: member.fullName,
            avatar: member.avatarUrl,
            role: roleInfo,
            graduationYear: graduationInfo,
          },
          message: `${member.fullName} joined the network`,
          description: graduationInfo ? `${graduationInfo} · ${roleInfo}` : roleInfo,
          createdAt: member.createdAt,
          actionable: true,
          actionLink: `/dashboard/profile/${member.id}`,
          actionLabel: "Connect",
        });
      });
    }

    // 2. New Connections
    if (type === "all" || type === "connections") {
      const newConnections = await prisma.connection.findMany({
        where: {
          organizationId: targetOrgId,
          status: ConnectionStatus.accepted,
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              userType: true,
            },
          },
          recipient: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              userType: true,
            },
          },
        },
        orderBy: {
          acceptedAt: "desc",
        },
        take: type === "all" ? 5 : limit,
      });

      newConnections.forEach(conn => {
        activities.push({
          id: `connection-${conn.id}`,
          type: "connection_made",
          actor: {
            id: conn.requester.id,
            name: conn.requester.fullName,
            avatar: conn.requester.avatarUrl,
          },
          target: {
            id: conn.recipient.id,
            name: conn.recipient.fullName,
            avatar: conn.recipient.avatarUrl,
          },
          message: `${conn.requester.fullName} connected with ${conn.recipient.fullName}`,
          createdAt: conn.acceptedAt,
          actionable: true,
          actionLink: `/dashboard/messages?userId=${conn.requester.id}`,
          actionLabel: "Message",
        });
      });
    }

    // 3. New Posts
    if (type === "all" || type === "posts") {
      const newPosts = await prisma.post.findMany({
        where: {
          organizationId: targetOrgId,
          deletedAt: null,
        },
        select: {
          id: true,
          content: true,
          postType: true,
          createdAt: true,
          reactionCount: true,
          commentCount: true,
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              userType: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: type === "all" ? 5 : limit,
      });

      newPosts.forEach(post => {
        const truncatedContent = post.content.length > 100 
          ? post.content.substring(0, 100) + "..."
          : post.content;

        activities.push({
          id: `post-${post.id}`,
          type: "post_created",
          actor: {
            id: post.author.id,
            name: post.author.fullName,
            avatar: post.author.avatarUrl,
          },
          message: `${post.author.fullName} shared a ${post.postType} post`,
          description: truncatedContent,
          createdAt: post.createdAt,
          metadata: {
            reactions: post.reactionCount,
            comments: post.commentCount,
          },
          actionable: true,
          actionLink: `/dashboard/feed/post/${post.id}`,
          actionLabel: "View Post",
        });
      });
    }

    // 4. New Events
    if (type === "all" || type === "events") {
      const newEvents = await prisma.event.findMany({
        where: {
          organizationId: targetOrgId,
          deletedAt: null,
          cancelledAt: null,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          mode: true,
          startsAt: true,
          locationName: true,
          registeredCount: true,
          maxCapacity: true,
          createdAt: true,
          organizer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: type === "all" ? 5 : limit,
      });

      newEvents.forEach(event => {
        const isUpcoming = new Date(event.startsAt) > new Date();
        
        activities.push({
          id: `event-${event.id}`,
          type: "event_created",
          actor: {
            id: event.organizer.id,
            name: event.organizer.fullName,
            avatar: event.organizer.avatarUrl,
          },
          message: `${event.organizer.fullName} created a new event: ${event.title}`,
          description: `${event.eventType.replace("_", " ")} · ${isUpcoming ? "Upcoming" : "Past"} · ${event.registeredCount} registered`,
          createdAt: event.createdAt,
          metadata: {
            eventType: event.eventType,
            mode: event.mode,
            location: event.locationName,
            startsAt: event.startsAt,
            capacity: event.maxCapacity,
          },
          actionable: true,
          actionLink: `/dashboard/events/${event.id}`,
          actionLabel: isUpcoming ? "Register" : "View Event",
        });
      });
    }

    // 5. New Jobs
    if (type === "all" || type === "jobs") {
      const newJobs = await prisma.jobPosting.findMany({
        where: {
          organizationId: targetOrgId,
          deletedAt: null,
          status: "active",
        },
        select: {
          id: true,
          title: true,
          jobType: true,
          locationCity: true,
          isRemote: true,
          salaryMin: true,
          salaryMax: true,
          companyName: true,
          createdAt: true,
          postedByUser: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: type === "all" ? 5 : limit,
      });

      newJobs.forEach(job => {
        const location = job.isRemote ? "Remote" : (job.locationCity || "Various locations");
        const salary = job.salaryMin 
          ? `$${job.salaryMin.toLocaleString()}${job.salaryMax ? ` - $${job.salaryMax.toLocaleString()}` : '+'}`
          : null;

        activities.push({
          id: `job-${job.id}`,
          type: "job_posted",
          actor: {
            id: job.postedByUser.id,
            name: job.postedByUser.fullName,
            avatar: job.postedByUser.avatarUrl,
          },
          message: `${job.postedByUser.fullName} posted a new job: ${job.title}`,
          description: `${job.jobType?.replace("_", " ")} · ${location}${salary ? ` · ${salary}` : ''}`,
          createdAt: job.createdAt,
          metadata: {
            company: job.companyName,
            jobType: job.jobType,
            location,
            salary,
          },
          actionable: true,
          actionLink: `/dashboard/jobs/${job.id}`,
          actionLabel: "Apply Now",
        });
      });
    }

    // 6. Mentorship Requests (Admin only or relevant to user)
    if ((type === "all" || type === "mentorship") && (isAdmin || type === "mentorship")) {
      const mentorshipRequests = await prisma.mentorshipRequest.findMany({
        where: {
          organizationId: targetOrgId,
          status: "pending",
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              studentProfile: {
                select: {
                  major: true,
                  expectedGraduation: true,
                },
              },
            },
          },
          alumni: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              alumniProfile: {
                select: {
                  currentCompany: true,
                  currentTitle: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: type === "all" ? 3 : limit,
      });

      mentorshipRequests.forEach(request => {
        activities.push({
          id: `mentorship-${request.id}`,
          type: "mentorship_request",
          actor: {
            id: request.student.id,
            name: request.student.fullName,
            avatar: request.student.avatarUrl,
          },
          target: {
            id: request.alumni.id,
            name: request.alumni.fullName,
            avatar: request.alumni.avatarUrl,
          },
          message: `${request.student.fullName} requested mentorship from ${request.alumni.fullName}`,
          description: request.student.studentProfile?.major 
            ? `Student in ${request.student.studentProfile.major}`
            : "Mentorship request",
          createdAt: request.createdAt,
          actionable: true,
          actionLink: `/dashboard/mentorship/${request.id}`,
          actionLabel: "Review Request",
        });
      });
    }

    // 7. Milestones (for admin view)
    if (type === "all" && isAdmin) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const milestones = [];

      // Check for member milestone
      const totalMembers = await prisma.user.count({
        where: {
          organizationId: targetOrgId,
          status: "active",
          deletedAt: null,
        },
      });

      if (totalMembers >= 100 && totalMembers < 200) {
        milestones.push({
          id: "milestone-100-members",
          type: "milestone",
          message: "🎉 Milestone Achieved! 100 members have joined your network!",
          description: "Your community is growing rapidly. Keep up the great work!",
          createdAt: new Date(),
          actionable: true,
          actionLink: "/dashboard/members",
          actionLabel: "View Members",
        });
      } else if (totalMembers >= 500 && totalMembers < 600) {
        milestones.push({
          id: "milestone-500-members",
          type: "milestone",
          message: "🌟 Incredible! 500 members are now part of your alumni network!",
          description: "This is a significant achievement. Consider organizing a special event to celebrate.",
          createdAt: new Date(),
          actionable: true,
          actionLink: "/dashboard/events/create",
          actionLabel: "Plan Celebration",
        });
      }

      if (milestones.length > 0) {
        activities.push(...milestones);
      }
    }

    // Sort all activities by date (newest first)
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);

    // Get unread count for notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      updates: sortedActivities,
      meta: {
        total: sortedActivities.length,
        hasMore: sortedActivities.length === limit,
        unreadNotifications,
        categories: {
          members: activities.filter(a => a.type === "member_joined").length,
          connections: activities.filter(a => a.type === "connection_made").length,
          posts: activities.filter(a => a.type === "post_created").length,
          events: activities.filter(a => a.type === "event_created").length,
          jobs: activities.filter(a => a.type === "job_posted").length,
          mentorship: activities.filter(a => a.type === "mentorship_request").length,
        },
      },
    });
  } catch (error: any) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch activity feed",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}