// app/api/dashboard/recommendations/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, JobType, EventType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "6");
    const type = url.searchParams.get("type") || "all"; // all, jobs, events, mentors, connections

    // Find user with profile data
    const user = await prisma.user.findFirst({
      where: { 
        metadata: { 
          path: ["clerkId"], 
          equals: clerkId 
        } 
      },
      include: {
        alumniProfile: true,
        studentProfile: true,
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ 
        recommendations: [],
        message: "User profile not found" 
      });
    }

    // Fetch user's skills
    const userProfileSkills = await prisma.profileSkill.findMany({
      where: { ownerId: user.id },
      include: { skill: true }
    });
    const userSkills = userProfileSkills.map(ps => ps.skill.name.toLowerCase());
    const userIndustry = user.alumniProfile?.industry || user.studentProfile?.major || null;
    const userLocation = user.alumniProfile?.city || user.studentProfile?.city || null;
    const userGraduationYear = user.alumniProfile?.graduationYear || user.studentProfile?.expectedGraduation || null;

    // Get user's connections to exclude them from recommendations
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: user.id, status: ConnectionStatus.accepted },
          { recipientId: user.id, status: ConnectionStatus.accepted },
        ],
      },
      select: {
        requesterId: true,
        recipientId: true,
      },
    });

    const connectedUserIds = new Set<string>();
    userConnections.forEach(conn => {
      if (conn.requesterId === user.id) connectedUserIds.add(conn.recipientId);
      if (conn.recipientId === user.id) connectedUserIds.add(conn.requesterId);
    });
    connectedUserIds.add(user.id); // Exclude self

    const recommendations: any[] = [];

    // 1. Job Recommendations based on skills and profile
    if (type === "all" || type === "jobs") {
      const jobWhereClause: any = {
        organizationId: user.organizationId,
        status: "active",
        deletedAt: null,
        expiresAt: { gt: new Date() },
      };

      // If user has skills, try to match jobs
      if (userSkills.length > 0) {
        // This is a simplified approach - in production, use full-text search or AI matching
        jobWhereClause.OR = [
          { title: { contains: userSkills[0], mode: "insensitive" } },
          { description: { contains: userSkills[0], mode: "insensitive" } },
        ];
      }

      // Filter by industry if available
      if (userIndustry) {
        jobWhereClause.description = {
          contains: userIndustry,
          mode: "insensitive",
        };
      }

      const jobs = await prisma.jobPosting.findMany({
        where: jobWhereClause,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          jobType: true,
          locationCity: true,
          locationCountry: true,
          isRemote: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          companyName: true,
          companyLogoUrl: true,
          isUrgent: true,
          isFeatured: true,
          createdAt: true,
          expiresAt: true,
          applicationCount: true,
          _count: {
            select: {
              applications: {
                where: { applicantId: user.id }
              }
            }
          }
        },
        orderBy: [
          { isFeatured: "desc" },
          { isUrgent: "desc" },
          { createdAt: "desc" },
        ],
        take: type === "all" ? 3 : limit,
      });

      const hasApplied = new Set(
        jobs.filter(j => j._count.applications > 0).map(j => j.id)
      );

      recommendations.push(...jobs.map(job => ({
        id: job.id,
        type: "job",
        title: job.title,
        company: job.companyName || "Organization",
        location: job.isRemote ? "Remote" : (job.locationCity || "Various locations"),
        salary: job.salaryMin ? `$${job.salaryMin.toLocaleString()}${job.salaryMax ? ` - $${job.salaryMax.toLocaleString()}` : '+'} ${job.salaryCurrency || 'USD'}` : null,
        jobType: job.jobType?.replace("_", " ") || "Full Time",
        logo: job.companyLogoUrl || "/api/placeholder/40/40",
        href: `/dashboard/jobs/${job.slug || job.id}`,
        isUrgent: job.isUrgent,
        isFeatured: job.isFeatured,
        hasApplied: hasApplied.has(job.id),
        matchScore: calculateJobMatchScore(job, userSkills, userIndustry),
      })));
    }

    // 2. Event Recommendations based on interests and location
    if (type === "all" || type === "events") {
      const eventWhereClause: any = {
        organizationId: user.organizationId,
        deletedAt: null,
        cancelledAt: null,
        isPublished: true,
        startsAt: { gt: new Date() },
      };

      // Location-based recommendations
      if (userLocation) {
        eventWhereClause.OR = [
          { locationCity: { contains: userLocation, mode: "insensitive" } },
          { locationName: { contains: userLocation, mode: "insensitive" } },
        ];
      }

      const events = await prisma.event.findMany({
        where: eventWhereClause,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          eventType: true,
          mode: true,
          locationName: true,
          locationCity: true,
          startsAt: true,
          endsAt: true,
          maxCapacity: true,
          registeredCount: true,
          isPaid: true,
          price: true,
          currencyCode: true,
          bannerUrl: true,
          isFeatured: true,
          organizer: {
            select: {
              fullName: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: { userId: user.id }
              }
            }
          }
        },
        orderBy: [
          { isFeatured: "desc" },
          { startsAt: "asc" },
        ],
        take: type === "all" ? 2 : limit,
      });

      const isRegistered = new Set(
        events.filter(e => e._count.registrations > 0).map(e => e.id)
      );

      recommendations.push(...events.map(event => ({
        id: event.id,
        type: "event",
        title: event.title,
        date: event.startsAt,
        location: event.mode === "online" ? "Online" : (event.locationName || event.locationCity || "TBD"),
        mode: event.mode,
        eventType: event.eventType,
        isFree: !event.isPaid,
        price: event.isPaid ? `${event.price} ${event.currencyCode}` : null,
        capacity: event.maxCapacity ? `${event.registeredCount || 0}/${event.maxCapacity}` : null,
        isRegistered: isRegistered.has(event.id),
        logo: event.bannerUrl || "/api/placeholder/40/40",
        href: `/dashboard/events/${event.slug || event.id}`,
        matchScore: calculateEventMatchScore(event, userLocation, userSkills),
      })));
    }

    // 3. Mentor/Connection Recommendations
    if ((type === "all" || type === "mentors" || type === "connections") && user.userType === UserType.student) {
      // Find potential mentors (alumni who are available for mentorship)
      const mentors: any[] = await prisma.alumniProfile.findMany({
        where: {
          organizationId: user.organizationId,
          isMentorAvailable: true,
          mentorshipSlots: { gt: 0 },
          userId: { notIn: Array.from(connectedUserIds) },
          OR: userSkills.length > 0 ? [
            { mentorshipTopics: { hasSome: userSkills } },
            { industry: { in: userSkills } },
          ] : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              avatarUrl: true,
            },
          },
        },
        take: type === "all" ? 2 : limit,
      });

      // Fetch mentor skills
      const mentorIds = mentors.map((m: any) => m.user.id);
      const mentorProfileSkills = await prisma.profileSkill.findMany({
        where: { ownerId: { in: mentorIds } },
        include: { skill: true }
      });
      const mentorSkillsMap = new Map();
      mentorProfileSkills.forEach(ps => {
         if (!mentorSkillsMap.has(ps.ownerId)) mentorSkillsMap.set(ps.ownerId, []);
         mentorSkillsMap.get(ps.ownerId).push(ps.skill.name);
      });

      recommendations.push(...mentors.map((mentor: any) => ({
        id: mentor.user.id,
        type: "mentor",
        name: mentor.user.fullName,
        title: mentor.currentTitle || "Alumni",
        company: mentor.currentCompany,
        headline: mentor.headline || "Alumni",
        skills: mentorSkillsMap.get(mentor.user.id) || [],
        topics: mentor.mentorshipTopics || [],
        avatar: mentor.user.avatarUrl || "/api/placeholder/40/40",
        href: `/dashboard/profile/${mentor.user.id}`,
        matchScore: calculateMentorMatchScore(mentor, userSkills, userIndustry),
      })));
    }

    // 4. Alumni to connect with (for alumni users)
    if ((type === "all" || type === "connections") && user.userType === UserType.alumni) {
      // Find alumni with similar industry or skills
      const similarAlumni: any[] = await prisma.alumniProfile.findMany({
        where: {
          organizationId: user.organizationId,
          userId: { 
            not: user.id,
            notIn: Array.from(connectedUserIds),
          },
          OR: [
            { industry: userIndustry || undefined },
            { currentCompany: user.alumniProfile?.currentCompany || undefined },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              avatarUrl: true,
            },
          },
        },
        take: type === "all" ? 2 : limit,
      });

      // Fetch alumni skills
      const alumniIds = similarAlumni.map((a: any) => a.user.id);
      const alumniProfileSkills = await prisma.profileSkill.findMany({
        where: { ownerId: { in: alumniIds } },
        include: { skill: true }
      });
      const alumniSkillsMap = new Map();
      alumniProfileSkills.forEach(ps => {
         if (!alumniSkillsMap.has(ps.ownerId)) alumniSkillsMap.set(ps.ownerId, []);
         alumniSkillsMap.get(ps.ownerId).push(ps.skill.name);
      });

      recommendations.push(...similarAlumni.map((alumni: any) => ({
        id: alumni.user.id,
        type: "connection",
        name: alumni.user.fullName,
        title: alumni.currentTitle || "Alumni",
        company: alumni.currentCompany,
        industry: alumni.industry,
        skills: alumniSkillsMap.get(alumni.user.id) || [],
        avatar: alumni.user.avatarUrl || "/api/placeholder/40/40",
        href: `/dashboard/profile/${alumni.user.id}`,
        matchScore: calculateAlumniMatchScore(alumni, user.alumniProfile),
      })));
    }

    // Sort recommendations by match score and limit
    const sortedRecommendations = recommendations
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, limit);

    // Get recommendation metadata
    const metadata = {
      totalAvailable: recommendations.length,
      shown: sortedRecommendations.length,
      userContext: {
        hasSkills: userSkills.length > 0,
        hasIndustry: !!userIndustry,
        userType: user.userType,
      },
    };

    return NextResponse.json({ 
      recommendations: sortedRecommendations,
      metadata,
    });
  } catch (error: any) {
    console.error("Dashboard recommendations error:", error);
    return NextResponse.json({ 
      recommendations: [],
      error: "Failed to load recommendations",
      metadata: { error: true }
    });
  }
}

// Helper function to calculate job match score
function calculateJobMatchScore(job: any, userSkills: string[], userIndustry: string | null): number {
  let score = 0;
  
  // Featured and urgent jobs get bonus
  if (job.isFeatured) score += 20;
  if (job.isUrgent) score += 10;
  
  // Skill matching
  const jobText = (job.title + " " + job.description).toLowerCase();
  const matchingSkills = userSkills.filter(skill => jobText.includes(skill.toLowerCase()));
  score += Math.min(matchingSkills.length * 15, 50);
  
  // Industry matching
  if (userIndustry && jobText.includes(userIndustry.toLowerCase())) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

// Helper function to calculate event match score
function calculateEventMatchScore(event: any, userLocation: string | null, userSkills: string[]): number {
  let score = 0;
  
  // Featured events get bonus
  if (event.isFeatured) score += 20;
  
  // Location matching
  if (userLocation && (event.locationCity?.toLowerCase().includes(userLocation.toLowerCase()) ||
      event.locationName?.toLowerCase().includes(userLocation.toLowerCase()))) {
    score += 30;
  }
  
  // Online events are always accessible
  if (event.mode === "online") score += 10;
  
  // Interest matching based on event type
  const eventText = (event.title + " " + (event.description || "")).toLowerCase();
  const matchingInterests = userSkills.filter(skill => eventText.includes(skill.toLowerCase()));
  score += Math.min(matchingInterests.length * 10, 30);
  
  return Math.min(score, 100);
}

// Helper function to calculate mentor match score
function calculateMentorMatchScore(mentor: any, userSkills: string[], userIndustry: string | null): number {
  let score = 0;
  
  // Topic matching
  const matchingTopics = mentor.mentorshipTopics?.filter((topic: string) => 
    userSkills.some(skill => topic.toLowerCase().includes(skill.toLowerCase()))
  ).length || 0;
  score += Math.min(matchingTopics * 20, 60);
  
  // Industry matching
  if (userIndustry && mentor.industry?.toLowerCase().includes(userIndustry.toLowerCase())) {
    score += 20;
  }
  
  // Skills matching
  const mentorSkills = mentor.user.profileSkills.map((ps: any) => ps.skill.name.toLowerCase());
  const matchingSkills = mentorSkills.filter((skill: string) => 
    userSkills.some(us => skill.includes(us))
  ).length;
  score += Math.min(matchingSkills * 10, 20);
  
  return Math.min(score, 100);
}

// Helper function to calculate alumni match score
function calculateAlumniMatchScore(alumni: any, currentUserProfile: any): number {
  let score = 0;
  
  // Same company
  if (currentUserProfile?.currentCompany && 
      alumni.currentCompany === currentUserProfile.currentCompany) {
    score += 40;
  }
  
  // Same industry
  if (currentUserProfile?.industry && 
      alumni.industry === currentUserProfile.industry) {
    score += 30;
  }
  
  // Similar skills (simplified)
  if (currentUserProfile?.profileSkills) {
    const userSkillNames = currentUserProfile.profileSkills.map((ps: any) => ps.skill.name);
    const alumniSkillNames = alumni.user.profileSkills.map((ps: any) => ps.skill.name);
    const commonSkills = userSkillNames.filter((s: string) => alumniSkillNames.includes(s));
    score += Math.min(commonSkills.length * 10, 30);
  }
  
  return Math.min(score, 100);
}