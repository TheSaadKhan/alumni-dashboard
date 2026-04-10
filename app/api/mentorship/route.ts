// app/api/mentorship/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, MentorshipStatus, MentorshipFrequency, Prisma } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET MENTORS & REQUESTS */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "mentors";
    const limit = parseInt(searchParams.get("limit") || "20");
    const skill = searchParams.get("skill");
    const industry = searchParams.get("industry");

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
        alumniProfile: {
          select: {
            industry: true,
            currentTitle: true,
            currentCompany: true,
          },
        },
        studentProfile: {
          select: {
            major: true,
            expectedGraduation: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Institutional affiliation required" },
        { status: 400 }
      );
    }

    if (type === "mentors") {
      // Find potential mentors (alumni who are available for mentorship)
      const whereClause: any = {
        organizationId: user.organizationId,
        userType: UserType.alumni,
        status: "active",
        id: { not: user.id },
        alumniProfile: {
          isMentorAvailable: true,
          mentorshipSlots: { gt: 0 },
        },
      };

      // Filter by skill if provided
      if (skill) {
        whereClause.alumniProfile = {
          ...whereClause.alumniProfile,
          mentorshipTopics: { has: skill },
        };
      }

      // Filter by industry if provided
      if (industry) {
        whereClause.alumniProfile = {
          ...whereClause.alumniProfile,
          industry: { contains: industry, mode: "insensitive" },
        };
      }

      const mentors = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          firstName: true,
          avatarUrl: true,
          alumniProfile: {
            select: {
              id: true,
              headline: true,
              currentTitle: true,
              currentCompany: true,
              industry: true,
              yearsOfExperience: true,
              mentorshipTopics: true,
              mentorshipSlots: true,
              bio: true,
              linkedinUrl: true,
            },
          },
          _count: {
            select: {
              mentorshipAsAlumni: {
                where: {
                  status: "accepted",
                },
              },
            },
          },
        },
        take: limit,
      });

      // Get existing mentorship requests from this user
      const existingRequests = await prisma.mentorshipRequest.findMany({
        where: {
          studentId: user.id,
          alumniId: { in: mentors.map(m => m.id) },
        },
        select: {
          alumniId: true,
          status: true,
        },
      });

      // Get all mentors' skills
      const mentorSkills = await prisma.profileSkill.findMany({
        where: { ownerId: { in: mentors.map(m => m.id) }, ownerType: "alumni_profile" },
        include: { skill: true }
      });
      
      const skillMap = new Map<string, string[]>();
      mentorSkills.forEach(ps => {
         if (!skillMap.has(ps.ownerId)) skillMap.set(ps.ownerId, []);
         skillMap.get(ps.ownerId)!.push(ps.skill.name);
      });

      const requestMap = new Map(
        existingRequests.map(req => [req.alumniId, req.status])
      );

      const mentorsData = mentors.map(mentor => ({
        id: mentor.id,
        name: mentor.fullName,
        title: mentor.alumniProfile?.currentTitle || "Mentor",
        company: mentor.alumniProfile?.currentCompany,
        headline: mentor.alumniProfile?.headline,
        industry: mentor.alumniProfile?.industry,
        experience: mentor.alumniProfile?.yearsOfExperience,
        topics: mentor.alumniProfile?.mentorshipTopics || [],
        skills: skillMap.get(mentor.id) || [],
        image: mentor.avatarUrl,
        bio: mentor.alumniProfile?.bio,
        linkedinUrl: mentor.alumniProfile?.linkedinUrl,
        availableSlots: mentor.alumniProfile?.mentorshipSlots || 0,
        activeMentees: mentor._count.mentorshipAsAlumni,
        requestStatus: requestMap.get(mentor.id) || null,
        canRequest: !requestMap.has(mentor.id),
      }));

      // Get mentor statistics
      const stats = {
        totalMentors: mentors.length,
        availableTopics: [...new Set(mentors.flatMap(m => m.alumniProfile?.mentorshipTopics || []))],
      };

      return NextResponse.json({
        success: true,
        mentors: mentorsData,
        stats,
      });
    } 
    
    if (type === "requests") {
      // Fetch mentorship requests for the user (both as student and alumni)
      const [sentRequests, receivedRequests] = await Promise.all([
        // Requests sent by user (as student)
        prisma.mentorshipRequest.findMany({
          where: {
            studentId: user.id,
          },
          include: {
            alumni: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
                alumniProfile: {
                  select: {
                    currentTitle: true,
                    currentCompany: true,
                  },
                },
              },
            },
            sessions: {
              orderBy: { scheduledAt: "desc" },
              take: 3,
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        // Requests received by user (as alumni)
        prisma.mentorshipRequest.findMany({
          where: {
            alumniId: user.id,
          },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
                studentProfile: {
                  select: {
                    major: true,
                    expectedGraduation: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const requests = {
        sent: sentRequests.map(req => ({
          id: req.id,
          status: req.status,
          message: req.message,
          goals: req.goals,
          preferredFrequency: req.preferredFrequency,
          createdAt: req.createdAt,
          expiresAt: req.expiresAt,
          mentor: {
            id: req.alumni.id,
            name: req.alumni.fullName,
            title: req.alumni.alumniProfile?.currentTitle,
            company: req.alumni.alumniProfile?.currentCompany,
            avatar: req.alumni.avatarUrl,
          },
          sessions: req.sessions,
        })),
        received: receivedRequests.map(req => ({
          id: req.id,
          status: req.status,
          message: req.message,
          goals: req.goals,
          preferredFrequency: req.preferredFrequency,
          createdAt: req.createdAt,
          student: {
            id: req.student.id,
            name: req.student.fullName,
            major: req.student.studentProfile?.major,
            expectedGraduation: req.student.studentProfile?.expectedGraduation,
            avatar: req.student.avatarUrl,
          },
        })),
      };

      const stats = {
        pendingReceived: receivedRequests.filter(r => r.status === "pending").length,
        activeMentorships: sentRequests.filter(r => r.status === "accepted").length,
        completed: sentRequests.filter(r => r.status === "completed").length,
      };

      return NextResponse.json({
        success: true,
        requests,
        stats,
      });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Mentorship GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch mentorship data" },
      { status: 500 }
    );
  }
}

/* ✅ SEND MENTORSHIP REQUEST */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
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

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Institutional affiliation required for mentorship" },
        { status: 400 }
      );
    }

    // Only students can send mentorship requests
    if (user.userType !== UserType.student) {
      return NextResponse.json(
        { error: "Only students can request mentorship" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      mentorId,
      goals,
      message,
      preferredFrequency,
    } = body;

    if (!mentorId) {
      return NextResponse.json(
        { error: "Mentor ID is required" },
        { status: 400 }
      );
    }

    if (!goals || (Array.isArray(goals) && goals.length === 0)) {
      return NextResponse.json(
        { error: "At least one goal is required" },
        { status: 400 }
      );
    }

    // Check if mentor exists and is available
    const mentor = await prisma.user.findFirst({
      where: {
        id: mentorId,
        organizationId: user.organizationId,
        userType: UserType.alumni,
        status: "active",
        alumniProfile: {
          isMentorAvailable: true,
          mentorshipSlots: { gt: 0 },
        },
      },
      select: {
        id: true,
        fullName: true,
        alumniProfile: {
          select: {
            mentorshipSlots: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found or not available" },
        { status: 404 }
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.mentorshipRequest.findFirst({
      where: {
        studentId: user.id,
        alumniId: mentorId,
        status: { in: ["pending", "accepted"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: `You already have a ${existingRequest.status} mentorship request with this mentor` },
        { status: 400 }
      );
    }

    const organizationId = user.organizationId;

    // Create mentorship request
    const mentorshipRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.mentorshipRequest.create({
        data: {
          organizationId: organizationId,
          studentId: user.id,
          alumniId: mentorId,
          goals: Array.isArray(goals) ? goals : [goals],
          message: message || null,
          preferredFrequency: preferredFrequency as MentorshipFrequency || null,
          status: MentorshipStatus.pending,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days expiry
        },
        include: {
          alumni: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Create notification for mentor
      await tx.notification.create({
        data: {
          userId: mentorId,
          organizationId: organizationId,
          type: "mentorship_request",
          category: "mentorship",
          title: "New Mentorship Request",
          body: `${user.fullName} has requested mentorship from you`,
          payload: {
            requestId: request.id,
            studentId: user.id,
            studentName: user.fullName,
            goals: request.goals,
          },
          actionUrl: `/dashboard/mentorship/requests`,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: organizationId,
          actorId: user.id,
          action: "mentorship.request_sent",
          entityType: "mentorship_request",
          entityId: request.id,
          entityLabel: `Mentorship request to ${mentor.fullName}`,
          afterState: {
            goals: request.goals,
            status: MentorshipStatus.pending,
          },
          severity: "info",
        },
      });

      return request;
    });

    return NextResponse.json(
      {
        success: true,
        request: {
          id: mentorshipRequest.id,
          status: mentorshipRequest.status,
          expiresAt: mentorshipRequest.expiresAt,
          goals: mentorshipRequest.goals,
          message: mentorshipRequest.message,
        },
        message: "Mentorship request sent successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Mentorship POST failed:", err);
    return NextResponse.json(
      { error: "Failed to send mentorship request" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE MENTORSHIP REQUEST (Accept/Decline/Cancel) */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Institutional affiliation required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { requestId, action, responseNote } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    const validActions = ["accept", "decline", "cancel"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept, decline, or cancel" },
        { status: 400 }
      );
    }

    // Get the mentorship request
    const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        alumni: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!mentorshipRequest) {
      return NextResponse.json(
        { error: "Mentorship request not found" },
        { status: 404 }
      );
    }

    // Check permissions based on action
    let isAuthorized = false;
    let targetUserId: string | null = null;

    if (action === "accept" || action === "decline") {
      // Only the mentor can accept/decline
      isAuthorized = mentorshipRequest.alumniId === user.id;
      targetUserId = mentorshipRequest.studentId;
    } else if (action === "cancel") {
      // Student can cancel their request, mentor can cancel accepted mentorship
      isAuthorized = 
        mentorshipRequest.studentId === user.id || 
        mentorshipRequest.alumniId === user.id;
      targetUserId = mentorshipRequest.alumniId === user.id 
        ? mentorshipRequest.studentId 
        : mentorshipRequest.alumniId;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action" },
        { status: 403 }
      );
    }

    // Determine new status
    let newStatus: MentorshipStatus;
    let notificationTitle: string;
    let notificationBody: string;

    switch (action) {
      case "accept":
        newStatus = MentorshipStatus.accepted;
        notificationTitle = "Mentorship Request Accepted";
        notificationBody = `${user.fullName} has accepted your mentorship request`;
        break;
      case "decline":
        newStatus = MentorshipStatus.declined;
        notificationTitle = "Mentorship Request Declined";
        notificationBody = `${user.fullName} has declined your mentorship request${responseNote ? `: ${responseNote}` : ''}`;
        break;
      case "cancel":
        newStatus = MentorshipStatus.cancelled;
        notificationTitle = "Mentorship Request Cancelled";
        notificationBody = `${user.fullName} has cancelled the mentorship request`;
        break;
      default:
        throw new Error("Invalid action");
    }

    const organizationId = user.organizationId;

    // Update the request
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.mentorshipRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          responseNote: responseNote || null,
          respondedBy: action === "accept" || action === "decline" ? user.id : undefined,
          respondedAt: action === "accept" || action === "decline" ? new Date() : undefined,
        },
      });

      // If accepting, decrement mentor's available slots
      if (action === "accept") {
        await tx.alumniProfile.update({
          where: { userId: mentorshipRequest.alumniId },
          data: {
            mentorshipSlots: { decrement: 1 },
          },
        });
      }

      // Create notification for the other party
      if (targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            organizationId: organizationId,
            type: `mentorship_${newStatus}`,
            category: "mentorship",
            title: notificationTitle,
            body: notificationBody,
            payload: {
              requestId,
              status: newStatus,
              responseNote: responseNote || null,
            },
            actionUrl: `/dashboard/mentorship/requests`,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: organizationId,
          actorId: user.id,
          action: `mentorship.request_${action}`,
          entityType: "mentorship_request",
          entityId: requestId,
          entityLabel: `Mentorship request ${action}ed`,
          afterState: {
            status: newStatus,
            responseNote: responseNote || null,
          },
          severity: "info",
        },
      });

      return request;
    });

    return NextResponse.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        respondedAt: updatedRequest.respondedAt,
      },
      message: `Mentorship request ${action}ed successfully`,
    });
  } catch (err: any) {
    console.error("Mentorship PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update mentorship request" },
      { status: 500 }
    );
  }
}