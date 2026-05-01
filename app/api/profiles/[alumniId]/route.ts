// app/api/profiles/[alumniId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET PUBLIC PROFILE */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ alumniId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { alumniId } = await context.params;
    
    // Validate UUID format to prevent Prisma errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(alumniId)) {
      return NextResponse.json(
        { error: "Invalid profile ID format" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includePrivate = searchParams.get("includePrivate") === "true";

    // Get current user if authenticated
    let currentUser = null;
    if (clerkId) {
      currentUser = await prisma.user.findFirst({
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
    }

    // Fetch the profile
    const profile: any = await prisma.user.findUnique({
      where: { id: alumniId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        alumniProfile: {
          include: {
            workHistory: {
              orderBy: { startedAt: "desc" },
              take: 10,
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
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                priority: true,
                color: true,
              },
            },
          },
          orderBy: {
            role: {
              priority: "desc",
            },
          },
        },
        _count: {
          select: {
            posts: {
              where: { deletedAt: null },
            },
            comments: {
              where: { isDeleted: false },
            },
            sentConnections: {
              where: { status: "accepted" },
            },
            receivedConnections: {
              where: { status: "accepted" },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if profile is public or user has permission
    const isOwnProfile = currentUser?.id === profile.id;
    const isSuperAdmin = currentUser?.userType === UserType.super_admin;
    const isOrgAdmin = currentUser?.userRoles.some((ur: any) => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSameOrganization = currentUser?.organizationId === profile.organizationId;

    const canViewPrivate = isOwnProfile || isSuperAdmin || (isOrgAdmin && isSameOrganization) || includePrivate;

    // Get connection status between current user and profile owner
    let connectionStatus = null;
    let mutualConnectionsCount = 0;

    if (currentUser && !isOwnProfile) {
      const connection = await prisma.connection.findFirst({
        where: {
          organizationId: profile.organizationId as string,
          OR: [
            { requesterId: currentUser.id, recipientId: profile.id },
            { requesterId: profile.id, recipientId: currentUser.id },
          ],
        },
        select: {
          id: true,
          status: true,
          requesterId: true,
          recipientId: true,
        },
      });

      if (connection) {
        connectionStatus = {
          status: connection.status,
          isRequester: connection.requesterId === currentUser.id,
          canConnect: connection.status !== ConnectionStatus.accepted && connection.status !== ConnectionStatus.pending,
        };
      } else {
        connectionStatus = {
          status: "not_connected",
          isRequester: false,
          canConnect: true,
        };
      }

      // Calculate mutual connections
      const currentUserConnections = await prisma.connection.findMany({
        where: {
          organizationId: profile.organizationId as string,
          OR: [
            { requesterId: currentUser.id, status: ConnectionStatus.accepted },
            { recipientId: currentUser.id, status: ConnectionStatus.accepted },
          ],
        },
        select: {
          requesterId: true,
          recipientId: true,
        },
      });

      const profileConnections = await prisma.connection.findMany({
        where: {
          organizationId: profile.organizationId as string,
          OR: [
            { requesterId: profile.id, status: ConnectionStatus.accepted },
            { recipientId: profile.id, status: ConnectionStatus.accepted },
          ],
        },
        select: {
          requesterId: true,
          recipientId: true,
        },
      });

      const currentUserConnectedIds = new Set(
        currentUserConnections.map(conn =>
          conn.requesterId === currentUser.id ? conn.recipientId : conn.requesterId
        )
      );

      const profileConnectedIds = new Set(
        profileConnections.map(conn =>
          conn.requesterId === profile.id ? conn.recipientId : conn.requesterId
        )
      );

      mutualConnectionsCount = [...currentUserConnectedIds].filter(id => profileConnectedIds.has(id)).length;
    }

    // Calculate total connections
    const totalConnections = profile._count.sentConnections + profile._count.receivedConnections;

    const mentorships = await prisma.mentorshipRequest.count({
      where: {
        status: "accepted",
        OR: [{ studentId: profile.id }, { alumniId: profile.id }],
      },
    });

    const skills = await prisma.profileSkill.findMany({
      where: {
        ownerId: profile.id,
        ownerType: profile.userType === UserType.alumni ? "alumni_profile" : "student_profile",
      },
      include: { skill: true },
      orderBy: { proficiencyLevel: "desc" },
      take: 20,
    });

    const education = await prisma.profileEducation.findMany({
      where: { ownerId: profile.id },
      orderBy: { startYear: "desc" },
      take: 10,
    });

    // Prepare response
    const response: any = {
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        firstName: profile.firstName,
        avatarUrl: profile.avatarUrl,
        coverImageUrl: profile.coverImageUrl,
        userType: profile.userType,
        createdAt: profile.createdAt,
        lastSeenAt: profile.lastSeenAt,
        
        // Organization
        organization: profile.organization,
        
        // Roles
        roles: profile.userRoles.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
          description: ur.role.description,
          priority: ur.role.priority,
          color: ur.role.color,
        })),
        
        // Statistics (public)
        stats: {
          posts: profile._count.posts,
          comments: profile._count.comments,
          connections: totalConnections,
          mentorships,
        },
        
        // Connection info
        connectionStatus,
        mutualConnections: mutualConnectionsCount,
        isOwnProfile,
      },
    };

    // Add alumni-specific data
    if (profile.userType === UserType.alumni && profile.alumniProfile) {
      response.profile.alumniProfile = {
        id: profile.alumniProfile.id,
        headline: profile.alumniProfile.headline,
        bio: profile.alumniProfile.bio,
        graduationYear: profile.alumniProfile.graduationYear,
        degree: profile.alumniProfile.degree,
        major: profile.alumniProfile.major,
        minor: profile.alumniProfile.minor,
        currentCompany: profile.alumniProfile.currentCompany,
        currentTitle: profile.alumniProfile.currentTitle,
        yearsOfExperience: profile.alumniProfile.yearsOfExperience,
        industry: profile.alumniProfile.industry,
        isOpenToWork: canViewPrivate ? profile.alumniProfile.isOpenToWork : null,
        isMentorAvailable: profile.alumniProfile.isMentorAvailable,
        mentorshipTopics: profile.alumniProfile.mentorshipTopics,
        isVerified: profile.alumniProfile.isVerified,
        city: profile.alumniProfile.city,
        countryCode: profile.alumniProfile.countryCode,
        
        // Social links (only show if allowed)
        linkedinUrl: canViewPrivate ? profile.alumniProfile.linkedinUrl : null,
        githubUrl: canViewPrivate ? profile.alumniProfile.githubUrl : null,
        twitterUrl: canViewPrivate ? profile.alumniProfile.twitterUrl : null,
        websiteUrl: canViewPrivate ? profile.alumniProfile.websiteUrl : null,
        
        // Skills
        skills: skills.map((ps: any) => ({
          id: ps.skill.id,
          name: ps.skill.name,
          normalizedName: ps.skill.normalizedName,
          proficiencyLevel: ps.proficiencyLevel,
          yearsExperience: ps.yearsExperience,
          endorsedCount: ps.endorsedCount,
        })),
        
        // Work history
        workHistory: profile.alumniProfile.workHistory.map((wh: any) => ({
          id: wh.id,
          company: wh.company,
          title: wh.title,
          employmentType: wh.employmentType,
          location: wh.location,
          isRemote: wh.isRemote,
          isCurrent: wh.isCurrent,
          startedAt: wh.startedAt,
          endedAt: wh.endedAt,
          description: wh.description,
          companyLogoUrl: wh.companyLogoUrl,
        })),
      };
    }

    // Add student-specific data
    if (profile.userType === UserType.student && profile.studentProfile) {
      response.profile.studentProfile = {
        id: profile.studentProfile.id,
        headline: profile.studentProfile.headline,
        bio: profile.studentProfile.bio,
        enrollmentYear: profile.studentProfile.enrollmentYear,
        expectedGraduation: profile.studentProfile.expectedGraduation,
        major: profile.studentProfile.major,
        minor: profile.studentProfile.minor,
        department: profile.studentProfile.department,
        isSeekingMentorship: profile.studentProfile.isSeekingMentorship,
        isSeekingInternship: canViewPrivate ? profile.studentProfile.isSeekingInternship : null,
        isSeekingFulltime: canViewPrivate ? profile.studentProfile.isSeekingFulltime : null,
        isVerified: profile.studentProfile.isVerified,
        city: profile.studentProfile.city,
        countryCode: profile.studentProfile.countryCode,
        
        // Social links (only show if allowed)
        linkedinUrl: canViewPrivate ? profile.studentProfile.linkedinUrl : null,
        githubUrl: canViewPrivate ? profile.studentProfile.githubUrl : null,
        portfolioUrl: canViewPrivate ? profile.studentProfile.portfolioUrl : null,
        
        // Skills
        skills: skills.map((ps: any) => ({
          id: ps.skill.id,
          name: ps.skill.name,
          normalizedName: ps.skill.normalizedName,
          proficiencyLevel: ps.proficiencyLevel,
          yearsExperience: ps.yearsExperience,
          endorsedCount: ps.endorsedCount,
        })),
      };
    }

    // Add education
    if (education.length > 0) {
      response.profile.education = education.map((edu: any) => ({
        id: edu.id,
        institution: edu.institution,
        degreeType: edu.degreeType,
        fieldOfStudy: edu.fieldOfStudy,
        startYear: edu.startYear,
        endYear: edu.endYear,
        isCurrent: edu.isCurrent,
        grade: edu.grade,
        description: edu.description,
      }));
    }

    // Increment profile view count (async, don't await)
    if (!isOwnProfile && currentUser) {
      if (profile.userType === UserType.alumni && profile.alumniProfile) {
        prisma.alumniProfile.update({
          where: { id: profile.alumniProfile.id },
          data: { viewCount: { increment: 1 } },
        }).catch(err => console.error("Failed to increment view count:", err));
      } else if (profile.userType === UserType.student && profile.studentProfile) {
        prisma.studentProfile.update({
          where: { id: profile.studentProfile.id },
          data: { viewCount: { increment: 1 } },
        }).catch(err => console.error("Failed to increment view count:", err));
      }
    }

    // Get recent posts by this user (if any)
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: profile.id,
        deletedAt: null,
      },
      select: {
        id: true,
        content: true,
        postType: true,
        createdAt: true,
        reactionCount: true,
        commentCount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentPosts.length > 0) {
      response.profile.recentPosts = recentPosts.map(post => ({
        id: post.id,
        content: post.content.substring(0, 200),
        postType: post.postType,
        createdAt: post.createdAt,
        reactionCount: post.reactionCount,
        commentCount: post.commentCount,
      }));
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ ENDORSE A SKILL */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ alumniId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alumniId } = await context.params;
    const body = await req.json();
    const { skillId } = body;

    if (!skillId) {
      return NextResponse.json(
        { error: "Skill ID is required" },
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
        organizationId: true,
        fullName: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to endorse themselves
    if (currentUser.id === alumniId) {
      return NextResponse.json(
        { error: "You cannot endorse your own skills" },
        { status: 400 }
      );
    }

    // Find the profile skill
    const profileSkill = await prisma.profileSkill.findFirst({
      where: {
        ownerId: alumniId,
        skillId,
        organizationId: currentUser.organizationId as string,
      },
    });

    if (!profileSkill) {
      return NextResponse.json(
        { error: "Skill not found on this profile" },
        { status: 404 }
      );
    }

    // Check if already endorsed
    const existingEndorsement = await prisma.skillEndorsement.findFirst({
      where: {
        profileSkillId: profileSkill.id,
        endorserId: currentUser.id,
      },
    });

    if (existingEndorsement) {
      return NextResponse.json(
        { error: "You have already endorsed this skill" },
        { status: 400 }
      );
    }

    // Create endorsement
    const endorsement = await prisma.skillEndorsement.create({
      data: {
        profileSkillId: profileSkill.id,
        endorserId: currentUser.id,
        organizationId: currentUser.organizationId as string,
      },
    });

    // Update endorsement count on profile skill
    await prisma.profileSkill.update({
      where: { id: profileSkill.id },
      data: { endorsedCount: { increment: 1 } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: alumniId,
        organizationId: currentUser.organizationId as string,
        type: "skill_endorsement",
        category: "social",
        title: "Skill Endorsement",
        body: `${currentUser.fullName} endorsed your skill`,
        payload: {
          skillId,
          endorserId: currentUser.id,
        },
        actionUrl: `/dashboard/profile/${alumniId}`,
      },
    });

    return NextResponse.json({
      success: true,
      endorsement,
      message: "Skill endorsed successfully",
    });
  } catch (error: any) {
    console.error("Endorse skill error:", error);
    return NextResponse.json(
      { error: "Failed to endorse skill" },
      { status: 500 }
    );
  }
}