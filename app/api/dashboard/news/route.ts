// app/api/dashboard/news/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, PostVisibility, AnnouncementAudience } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const type = url.searchParams.get("type") || "all"; // all, posts, announcements, activity
    const skip = (page - 1) * limit;

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
        organizationId: true,
        userType: true,
        userRoles: {
          where: {
            revokedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
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

    // Use provided organizationId or fallback to user's organization
    const targetOrgId = organizationId || user.organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 400 }
      );
    }

    const isGlobalSuperAdmin = user.userType === UserType.super_admin;
    const userRoleSlugs = user.userRoles.map(ur => ur.role.slug);

    // Check if user has access to this organization
    const hasAccess = isGlobalSuperAdmin || user.userRoles.some(
      ur => ur.organizationId === targetOrgId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this organization" },
        { status: 403 }
      );
    }

    // Prepare response object
    const response: any = {
      success: true,
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false,
      },
    };

    // Fetch different types of news based on filter
    if (type === "all" || type === "posts") {
      // Fetch posts
      const postsWhereClause: any = {
        organizationId: targetOrgId,
        deletedAt: null,
      };

      // Apply visibility rules
      if (!isGlobalSuperAdmin && !userRoleSlugs.includes("admin")) {
        postsWhereClause.OR = [
          { visibility: PostVisibility.org },
          { visibility: PostVisibility.alumni_only, authorId: user.id },
          { visibility: PostVisibility.connections, authorId: user.id },
          { authorId: user.id },
        ];
      }

      const [posts, postsCount] = await Promise.all([
        prisma.post.findMany({
          where: postsWhereClause,
          select: {
            id: true,
            content: true,
            contentHtml: true,
            postType: true,
            visibility: true,
            isPinned: true,
            isFeatured: true,
            createdAt: true,
            updatedAt: true,
            viewCount: true,
            commentCount: true,
            reactionCount: true,
            shareCount: true,
            author: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
                userType: true,
                alumniProfile: {
                  select: {
                    headline: true,
                    currentCompany: true,
                    currentTitle: true,
                  },
                },
                studentProfile: {
                  select: {
                    headline: true,
                    major: true,
                  },
                },
              },
            },
            attachments: {
              select: {
                id: true,
                fileUrl: true,
                cdnUrl: true,
                fileName: true,
                mimeType: true,
                thumbnailUrl: true,
              },
              take: 3,
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: [
            { isPinned: "desc" },
            { isFeatured: "desc" },
            { createdAt: "desc" },
          ],
          skip: type === "all" ? 0 : skip,
          take: type === "all" ? 5 : limit,
        }),
        prisma.post.count({ where: postsWhereClause }),
      ]);

      // Get user's reactions to posts
      const userReactions = await prisma.reaction.findMany({
        where: {
          userId: user.id,
          entityType: "post",
          entityId: { in: posts.map(p => p.id) },
        },
        select: {
          entityId: true,
          emoji: true,
        },
      });

      const reactionMap = new Map(
        userReactions.map(r => [r.entityId, r.emoji])
      );

      const enhancedPosts = posts.map((post: any) => ({
        type: "post",
        ...post,
        userReaction: reactionMap.get(post.id) || null,
        isOwner: post.author.id === user.id,
        canModerate: isGlobalSuperAdmin || userRoleSlugs.includes("admin"),
      }));

      if (type === "posts") {
        response.items = enhancedPosts;
        response.pagination.total = postsCount;
        response.pagination.hasMore = skip + limit < postsCount;
        return NextResponse.json(response);
      }

      response.posts = enhancedPosts;
      response.postsTotal = postsCount;
    }

    if (type === "all" || type === "announcements") {
      // Fetch announcements
      const announcementsWhereClause: any = {
        organizationId: targetOrgId,
        deletedAt: null,
        publishAt: { lte: new Date() },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      };

      // Apply audience filtering
      if (!isGlobalSuperAdmin && !userRoleSlugs.includes("admin")) {
        if (user.userType === UserType.alumni) {
          announcementsWhereClause.audience = {
            in: [AnnouncementAudience.all, AnnouncementAudience.alumni],
          };
        } else if (user.userType === UserType.student) {
          announcementsWhereClause.audience = {
            in: [AnnouncementAudience.all, AnnouncementAudience.students],
          };
        } else {
          announcementsWhereClause.audience = AnnouncementAudience.all;
        }
      }

      const [announcements, announcementsCount] = await Promise.all([
        prisma.announcement.findMany({
          where: announcementsWhereClause,
          select: {
            id: true,
            title: true,
            content: true,
            contentHtml: true,
            audience: true,
            priority: true,
            requiresAcknowledgement: true,
            bannerUrl: true,
            ctaLabel: true,
            ctaUrl: true,
            publishAt: true,
            expiresAt: true,
            createdAt: true,
            readCount: true,
            ackCount: true,
            author: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [
            { priority: "desc" },
            { publishAt: "desc" },
          ],
          skip: type === "all" ? 0 : skip,
          take: type === "all" ? 3 : limit,
        }),
        prisma.announcement.count({ where: announcementsWhereClause }),
      ]);

      // Get user's read status for announcements
      const userReads = await prisma.announcementRead.findMany({
        where: {
          userId: user.id,
          announcementId: { in: announcements.map(a => a.id) },
        },
        select: {
          announcementId: true,
          readAt: true,
          acknowledged: true,
        },
      });

      const readMap = new Map(
        userReads.map(r => [r.announcementId, { readAt: r.readAt, acknowledged: r.acknowledged }])
      );

      const enhancedAnnouncements = announcements.map((announcement: any) => ({
        type: "announcement",
        ...announcement,
        isRead: readMap.has(announcement.id),
        isAcknowledged: readMap.get(announcement.id)?.acknowledged || false,
        readAt: readMap.get(announcement.id)?.readAt || null,
      }));

      if (type === "announcements") {
        response.items = enhancedAnnouncements;
        response.pagination.total = announcementsCount;
        response.pagination.hasMore = skip + limit < announcementsCount;
        return NextResponse.json(response);
      }

      response.announcements = enhancedAnnouncements;
      response.announcementsTotal = announcementsCount;
    }

    if (type === "all" || type === "activity") {
      // Fetch recent activity from audit logs
      const [activities, activitiesCount] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            organizationId: targetOrgId,
          },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityLabel: true,
            createdAt: true,
            severity: true,
            actor: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
                userType: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: type === "all" ? 0 : skip,
          take: type === "all" ? 5 : limit,
        }),
        prisma.auditLog.count({
          where: { organizationId: targetOrgId },
        }),
      ]);

      const enhancedActivities = activities.map((activity: any) => ({
        type: "activity",
        ...activity,
        description: formatActivityDescription(activity),
      }));

      if (type === "activity") {
        response.items = enhancedActivities;
        response.pagination.total = activitiesCount;
        response.pagination.hasMore = skip + limit < activitiesCount;
        return NextResponse.json(response);
      }

      response.activities = enhancedActivities;
      response.activitiesTotal = activitiesCount;
    }

    // Combine all items for the main feed
    if (type === "all") {
      const allItems = [
        ...(response.announcements || []).map((a: any) => ({ ...a, timestamp: a.publishAt })),
        ...(response.posts || []).map((p: any) => ({ ...p, timestamp: p.createdAt })),
        ...(response.activities || []).map((a: any) => ({ ...a, timestamp: a.createdAt })),
      ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, limit);

      response.items = allItems;
      response.pagination.total = 
        (response.postsTotal || 0) + 
        (response.announcementsTotal || 0) + 
        (response.activitiesTotal || 0);
      response.pagination.hasMore = allItems.length === limit;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Dashboard news API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch news feed",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to format activity descriptions
function formatActivityDescription(activity: any): string {
  const actionMap: Record<string, string> = {
    "user.created": "joined the organization",
    "user.updated": "updated their profile",
    "post.created": "created a new post",
    "post.deleted": "deleted a post",
    "comment.created": "commented on a post",
    "event.created": "created a new event",
    "event.updated": "updated an event",
    "job.created": "posted a new job",
    "job.updated": "updated a job posting",
    "connection.created": "connected with someone",
    "mentorship.created": "started a mentorship",
    "invitation.created": "sent an invitation",
    "invitation.accepted": "accepted an invitation",
    "role.assigned": "was assigned a new role",
    "organization.updated": "updated organization settings",
  };

  const action = activity.action;
  const actorName = activity.actor?.fullName || "Someone";
  
  if (actionMap[action]) {
    return `${actorName} ${actionMap[action]}`;
  }

  // Handle custom actions
  if (action.includes(".")) {
    const [entity, verb] = action.split(".");
    return `${actorName} ${verb} a ${entity}`;
  }

  return `${actorName} performed ${action}`;
}

// POST: Create a new post or announcement
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, title, visibility, postType, attachments } = body;

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
          include: { role: true },
        },
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "User or organization not found" }, { status: 404 });
    }

    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );

    if (type === "announcement" && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create announcements" },
        { status: 403 }
      );
    }

    if (type === "post") {
      // Create a new post
      const post = await prisma.post.create({
        data: {
          content,
          postType: postType || "general",
          visibility: visibility || PostVisibility.org,
          authorId: user.id,
          organizationId: user.organizationId,
        },
      });

      // Create attachments if provided
      if (attachments && attachments.length > 0) {
        await prisma.postAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            postId: post.id,
            organizationId: user.organizationId,
            fileUrl: attachment.url,
            fileName: attachment.name,
            mimeType: attachment.type,
            fileSizeBytes: attachment.size,
          })),
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "post.created",
          entityType: "post",
          entityId: post.id,
          severity: "info",
        },
      });

      return NextResponse.json({
        success: true,
        post,
      });
    }

    if (type === "announcement") {
      // Create a new announcement
      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          audience: body.audience || AnnouncementAudience.all,
          priority: body.priority || "normal",
          requiresAcknowledgement: body.requiresAcknowledgement || false,
          bannerUrl: body.bannerUrl,
          ctaLabel: body.ctaLabel,
          ctaUrl: body.ctaUrl,
          publishAt: body.publishAt ? new Date(body.publishAt) : new Date(),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          authorId: user.id,
          organizationId: user.organizationId,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "announcement.created",
          entityType: "announcement",
          entityId: announcement.id,
          severity: "info",
        },
      });

      return NextResponse.json({
        success: true,
        announcement,
      });
    }

    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Create news item error:", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}