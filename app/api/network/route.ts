// app/api/network/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET NETWORK PROFILES */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const query = searchParams.get("query") || "";
    const userType = searchParams.get("userType") || "all"; // all, alumni, student
    const connectionStatus = searchParams.get("connectionStatus") || "all"; // all, connected, pending, not_connected
    const industry = searchParams.get("industry");
    const location = searchParams.get("location");
    const graduationYear = searchParams.get("graduationYear");
    const skills = searchParams.get("skills")?.split(",");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        organizationId: true,
        userType: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's connections to know connection status
    const connections = await prisma.connection.findMany({
      where: {
        organizationId: organizationId as string,
        OR: [
          { requesterId: currentUser.id, status: ConnectionStatus.accepted },
          { recipientId: currentUser.id, status: ConnectionStatus.accepted },
        ],
      },
      select: {
        requesterId: true,
        recipientId: true,
        status: true,
      },
    });

    const connectedUserIds = new Set<string>();
    const pendingSentUserIds = new Set<string>();
    const pendingReceivedUserIds = new Set<string>();

    connections.forEach(conn => {
      if (conn.status === ConnectionStatus.accepted) {
        if (conn.requesterId === currentUser.id) {
          connectedUserIds.add(conn.recipientId);
        } else {
          connectedUserIds.add(conn.requesterId);
        }
      } else if (conn.status === ConnectionStatus.pending) {
        if (conn.requesterId === currentUser.id) {
          pendingSentUserIds.add(conn.recipientId);
        } else {
          pendingReceivedUserIds.add(conn.requesterId);
        }
      }
    });

    // Build where clause
    const whereClause: any = {
      organizationId: organizationId as string,
      status: "active",
      deletedAt: null,
      id: { not: currentUser.id }, // Exclude self
    };

    // Search query
    if (query) {
      whereClause.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { alumniProfile: { headline: { contains: query, mode: "insensitive" } } },
        { alumniProfile: { currentTitle: { contains: query, mode: "insensitive" } } },
        { studentProfile: { headline: { contains: query, mode: "insensitive" } } },
        { studentProfile: { major: { contains: query, mode: "insensitive" } } },
      ];
    }

    // User type filter
    if (userType !== "all") {
      whereClause.userType = userType as UserType;
    }

    // Industry filter (alumni only)
    if (industry) {
      whereClause.alumniProfile = {
        industry: { contains: industry, mode: "insensitive" },
      };
    }

    // Location filter
    if (location) {
      whereClause.OR = [
        { alumniProfile: { city: { contains: location, mode: "insensitive" } } },
        { studentProfile: { city: { contains: location, mode: "insensitive" } } },
      ];
    }

    // Graduation year filter
    if (graduationYear) {
      const year = parseInt(graduationYear);
      whereClause.OR = [
        { alumniProfile: { graduationYear: year } },
        { studentProfile: { expectedGraduation: year } },
      ];
    }

    // Skills filter (ProfileSkill is not a direct User relation in this schema)

    // Connection status filter
    if (connectionStatus !== "all") {
      if (connectionStatus === "connected") {
        whereClause.id = { in: Array.from(connectedUserIds) };
      } else if (connectionStatus === "pending") {
        whereClause.id = { in: Array.from([...pendingSentUserIds, ...pendingReceivedUserIds]) };
      } else if (connectionStatus === "not_connected") {
        whereClause.id = { notIn: Array.from(connectedUserIds) };
        whereClause.id = { notIn: Array.from([...pendingSentUserIds, ...pendingReceivedUserIds]) };
      }
    }

    // Fetch users with their profiles
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          alumniProfile: {
            include: {
              workHistory: {
                orderBy: { startedAt: "desc" },
                take: 1,
              },
            },
          },
          studentProfile: true,
          userRoles: {
            where: {
              organizationId: organizationId as string,
              revokedAt: null,
            },
            include: {
              role: true,
            },
            take: 1,
          },
        },
        orderBy: [
          { fullName: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Format network data
    const network = users.map(user => {
      const profile = user.alumniProfile || user.studentProfile;
      const role = user.userRoles[0]?.role;
      const isConnected = connectedUserIds.has(user.id);
      const isPendingSent = pendingSentUserIds.has(user.id);
      const isPendingReceived = pendingReceivedUserIds.has(user.id);
      
      // Calculate mutual connections count
      const mutualConnections = connections.filter(conn => {
        const otherId = conn.requesterId === currentUser.id ? conn.recipientId : conn.requesterId;
        return connectedUserIds.has(otherId) && (conn.requesterId === user.id || conn.recipientId === user.id);
      }).length;

      return {
        id: user.id,
        name: user.fullName,
        firstName: user.firstName,
        email: user.email,
        headline: profile?.headline || (user.userType === "alumni" ? "Alumni" : "Student"),
        avatar: user.avatarUrl,
        location: profile?.city || "Location not specified",
        userType: user.userType,
        role: role?.name || "Member",
        roleSlug: role?.slug,
        isVerified: profile?.isVerified || false,
        isFeatured: profile?.isFeatured || false,
        
        // Alumni specific
        graduationYear: user.alumniProfile?.graduationYear,
        currentCompany: user.alumniProfile?.currentCompany,
        currentTitle: user.alumniProfile?.currentTitle,
        industry: user.alumniProfile?.industry,
        yearsOfExperience: user.alumniProfile?.yearsOfExperience,
        isOpenToWork: user.alumniProfile?.isOpenToWork,
        isMentorAvailable: user.alumniProfile?.isMentorAvailable,
        workHistory: user.alumniProfile?.workHistory,
        
        // Student specific
        expectedGraduation: user.studentProfile?.expectedGraduation,
        major: user.studentProfile?.major,
        isSeekingMentorship: user.studentProfile?.isSeekingMentorship,
        isSeekingInternship: user.studentProfile?.isSeekingInternship,
        isSeekingFulltime: user.studentProfile?.isSeekingFulltime,
        
        // Skills (fetched via ProfileSkill table elsewhere; omit here for now)
        skills: [],
        
        // Connection status
        connectionStatus: isConnected ? "connected" : (isPendingSent ? "pending_sent" : (isPendingReceived ? "pending_received" : "not_connected")),
        mutualConnections,
        
        // Social links
        linkedinUrl: user.alumniProfile?.linkedinUrl || user.studentProfile?.linkedinUrl,
        githubUrl: user.alumniProfile?.githubUrl || user.studentProfile?.githubUrl,
        
        // Activity
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
      };
    });

    // Get filter options for frontend
    const filterOptions = await getFilterOptions(organizationId as string);

    // Get statistics
    const stats = {
      total: totalCount,
      connected: connectedUserIds.size,
      pending: pendingSentUserIds.size + pendingReceivedUserIds.size,
      alumni: await prisma.user.count({
        where: { organizationId: organizationId as string, userType: UserType.alumni, status: "active", deletedAt: null },
      }),
      students: await prisma.user.count({
        where: { organizationId: organizationId as string, userType: UserType.student, status: "active", deletedAt: null },
      }),
    };

    return NextResponse.json({
      success: true,
      network,
      stats,
      filterOptions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Network search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch network" },
      { status: 500 }
    );
  }
}

/* ✅ CONNECT WITH USER */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, message } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        organizationId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if target user exists and is in same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: currentUser.organizationId as string,
        status: "active",
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found or not in your organization" },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        organizationId: currentUser.organizationId as string,
        OR: [
          { requesterId: currentUser.id, recipientId: targetUserId },
          { requesterId: targetUserId, recipientId: currentUser.id },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.accepted) {
        return NextResponse.json(
          { error: "You are already connected with this user" },
          { status: 400 }
        );
      } else if (existingConnection.status === ConnectionStatus.pending) {
        if (existingConnection.requesterId === currentUser.id) {
          return NextResponse.json(
            { error: "Connection request already sent" },
            { status: 400 }
          );
        } else {
          // Accept the pending request
          const updated = await prisma.connection.update({
            where: { id: existingConnection.id },
            data: {
              status: ConnectionStatus.accepted,
              acceptedAt: new Date(),
            },
          });

          // Create notifications
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              organizationId: currentUser.organizationId as string,
              type: "connection_accepted",
              category: "social",
              title: "Connection Accepted",
              body: `${currentUser.fullName} accepted your connection request`,
              payload: {
                connectionId: updated.id,
                userId: currentUser.id,
              },
              actionUrl: `/dashboard/network/${currentUser.id}`,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Connection request accepted",
            status: "accepted",
          });
        }
      }
    }

    // Create new connection request
    const connection = await prisma.connection.create({
      data: {
        organizationId: currentUser.organizationId as string,
        requesterId: currentUser.id,
        recipientId: targetUserId,
        status: ConnectionStatus.pending,
        message: message || null,
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        organizationId: currentUser.organizationId as string,
        type: "connection_request",
        category: "social",
        title: "New Connection Request",
        body: `${currentUser.fullName} wants to connect with you${message ? `: ${message.substring(0, 100)}` : ''}`,
        payload: {
          connectionId: connection.id,
          userId: currentUser.id,
          userName: currentUser.fullName,
          message: message,
        },
        actionUrl: `/dashboard/network/requests`,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: currentUser.organizationId as string,
        actorId: currentUser.id,
        action: "connection.request_sent",
        entityType: "connection",
        entityId: connection.id,
        afterState: {
          targetUserId,
          status: ConnectionStatus.pending,
        },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Connection request sent",
      connection: {
        id: connection.id,
        status: connection.status,
      },
    });
  } catch (error: any) {
    console.error("Connection request error:", error);
    return NextResponse.json(
      { error: "Failed to send connection request" },
      { status: 500 }
    );
  }
}

// Helper function to get filter options
async function getFilterOptions(organizationId: string) {
  const [industries, locations, graduationYears, skills] = await Promise.all([
    // Get unique industries from alumni profiles
    prisma.alumniProfile.findMany({
      where: { organizationId, industry: { not: null } },
      select: { industry: true },
      distinct: ["industry"],
    }),
    // Get unique locations
    prisma.user.findMany({
      where: {
        organizationId,
        OR: [
          { alumniProfile: { city: { not: null } } },
          { studentProfile: { city: { not: null } } },
        ],
      },
      select: {
        alumniProfile: { select: { city: true } },
        studentProfile: { select: { city: true } },
      },
    }),
    // Get unique graduation years
    prisma.alumniProfile.findMany({
      where: { organizationId, graduationYear: { not: null } },
      select: { graduationYear: true },
      distinct: ["graduationYear"],
      orderBy: { graduationYear: "desc" },
    }),
    // Get top skills
    prisma.profileSkill.findMany({
      where: { organizationId },
      include: { skill: true },
      orderBy: { endorsedCount: "desc" },
      take: 20,
    }),
  ]);

  const uniqueIndustries = [...new Set(industries.map(i => i.industry).filter(Boolean))];
  const uniqueLocations = [...new Set([
    ...locations.map(l => l.alumniProfile?.city),
    ...locations.map(l => l.studentProfile?.city),
  ].filter(Boolean))];
  const uniqueGraduationYears = [...new Set(graduationYears.map(y => y.graduationYear).filter(Boolean))];
  const topSkills = [...new Map(skills.map(s => [s.skill.name, s.skill])).values()].slice(0, 10);

  return {
    industries: uniqueIndustries,
    locations: uniqueLocations,
    graduationYears: uniqueGraduationYears,
    skills: topSkills.map(s => ({ id: s.id, name: s.name })),
  };
}