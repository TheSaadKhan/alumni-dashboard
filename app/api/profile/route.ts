// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, UserStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET CURRENT USER PROFILE */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includePrivate = searchParams.get("includePrivate") === "true";

    // Fetch user with necessary relations (skills/education fetched separately)
    const user: any = await prisma.user.findFirst({
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
            isActive: true,
            isVerified: true,
            planTier: true,
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
            reactions: true,
            sentConnections: {
              where: { status: "accepted" },
            },
            receivedConnections: {
              where: { status: "accepted" },
            },
            jobApplications: true,
            eventRegistrations: {
              where: {
                status: { in: ["registered", "approved", "attended"] },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(user);

    // Get unread notifications count
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

    // Get pending connection requests
    const pendingConnections = await prisma.connection.count({
      where: {
        recipientId: user.id,
        status: "pending",
      },
    });

    // Get user's permissions
    const isAdmin = user.userRoles.some((ur: any) => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSuperAdmin = user.userType === UserType.super_admin;

    // Calculate total connections
    const totalConnections = user._count.sentConnections + user._count.receivedConnections;

    const mentorships = await prisma.mentorshipRequest.count({
      where: {
        status: "accepted",
        OR: [{ studentId: user.id }, { alumniId: user.id }],
      },
    });

    const skills = await prisma.profileSkill.findMany({
      where: {
        ownerId: user.id,
        ownerType: user.userType === UserType.alumni ? "alumni_profile" : "student_profile",
      },
      include: { skill: true },
      orderBy: { proficiencyLevel: "desc" },
      take: 20,
    });

    const education = await prisma.profileEducation.findMany({
      where: { ownerId: user.id },
      orderBy: { startYear: "desc" },
      take: 10,
    });

    // Prepare response
    const response: any = {
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        avatarUrl: user.avatarUrl,
        coverImageUrl: user.coverImageUrl,
        phone: includePrivate ? user.phone : null,
        phoneVerified: user.phoneVerified,
        status: user.status,
        userType: user.userType,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        
        // Organization
        organization: user.organization,
        
        // Roles
        roles: user.userRoles.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
          description: ur.role.description,
          priority: ur.role.priority,
          color: ur.role.color,
        })),
        
        // Profile completeness
        profileCompleteness,
        
        // Statistics
        stats: {
          posts: user._count.posts,
          comments: user._count.comments,
          reactions: user._count.reactions,
          connections: totalConnections,
          mentorships,
          jobApplications: user._count.jobApplications,
          eventRegistrations: user._count.eventRegistrations,
          unreadNotifications,
          pendingConnections,
        },
        
        // Permissions
        permissions: {
          isAdmin,
          isSuperAdmin,
          canManageUsers: isAdmin || isSuperAdmin,
          canManageContent: isAdmin || isSuperAdmin,
          canManageSettings: isAdmin || isSuperAdmin,
        },
      },
    };

    // Add alumni-specific data
    if (user.userType === UserType.alumni && user.alumniProfile) {
      response.profile.alumniProfile = {
        id: user.alumniProfile.id,
        headline: user.alumniProfile.headline,
        bio: user.alumniProfile.bio,
        graduationYear: user.alumniProfile.graduationYear,
        degree: user.alumniProfile.degree,
        major: user.alumniProfile.major,
        minor: user.alumniProfile.minor,
        gpa: user.alumniProfile.gpa,
        currentCompany: user.alumniProfile.currentCompany,
        currentTitle: user.alumniProfile.currentTitle,
        yearsOfExperience: user.alumniProfile.yearsOfExperience,
        industry: user.alumniProfile.industry,
        linkedinUrl: user.alumniProfile.linkedinUrl,
        githubUrl: user.alumniProfile.githubUrl,
        twitterUrl: user.alumniProfile.twitterUrl,
        websiteUrl: user.alumniProfile.websiteUrl,
        resumeUrl: includePrivate ? user.alumniProfile.resumeUrl : null,
        city: user.alumniProfile.city,
        countryCode: user.alumniProfile.countryCode,
        isOpenToWork: user.alumniProfile.isOpenToWork,
        isMentorAvailable: user.alumniProfile.isMentorAvailable,
        mentorshipSlots: user.alumniProfile.mentorshipSlots,
        mentorshipTopics: user.alumniProfile.mentorshipTopics,
        isVerified: user.alumniProfile.isVerified,
        isFeatured: user.alumniProfile.isFeatured,
        viewCount: user.alumniProfile.viewCount,
        skills: skills.map((ps: any) => ({
          id: ps.skill.id,
          name: ps.skill.name,
          normalizedName: ps.skill.normalizedName,
          proficiencyLevel: ps.proficiencyLevel,
          yearsExperience: ps.yearsExperience,
          endorsedCount: ps.endorsedCount,
        })),
        workHistory: user.alumniProfile.workHistory.map((wh: any) => ({
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
    if (user.userType === UserType.student && user.studentProfile) {
      response.profile.studentProfile = {
        id: user.studentProfile.id,
        headline: user.studentProfile.headline,
        bio: user.studentProfile.bio,
        enrollmentYear: user.studentProfile.enrollmentYear,
        expectedGraduation: user.studentProfile.expectedGraduation,
        major: user.studentProfile.major,
        minor: user.studentProfile.minor,
        department: user.studentProfile.department,
        gpa: user.studentProfile.gpa,
        linkedinUrl: user.studentProfile.linkedinUrl,
        githubUrl: user.studentProfile.githubUrl,
        portfolioUrl: user.studentProfile.portfolioUrl,
        city: user.studentProfile.city,
        countryCode: user.studentProfile.countryCode,
        isSeekingMentorship: user.studentProfile.isSeekingMentorship,
        isSeekingInternship: user.studentProfile.isSeekingInternship,
        isSeekingFulltime: user.studentProfile.isSeekingFulltime,
        isVerified: user.studentProfile.isVerified,
        isFeatured: user.studentProfile.isFeatured,
        viewCount: user.studentProfile.viewCount,
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

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Profile GET failed:", err);
    return NextResponse.json(
      { 
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE CURRENT USER PROFILE */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Basic info
      firstName,
      lastName,
      phone,
      avatarUrl,
      coverImageUrl,
      
      // Profile info
      headline,
      bio,
      city,
      countryCode,
      
      // Alumni specific
      degree,
      major,
      minor,
      graduationYear,
      gpa,
      currentCompany,
      currentTitle,
      yearsOfExperience,
      industry,
      isOpenToWork,
      isMentorAvailable,
      mentorshipTopics,
      
      // Student specific
      enrollmentYear,
      expectedGraduation,
      department,
      isSeekingMentorship,
      isSeekingInternship,
      isSeekingFulltime,
      
      // Social links
      linkedinUrl,
      githubUrl,
      twitterUrl,
      websiteUrl,
      portfolioUrl,
      resumeUrl,
      
      // Skills
      skills,
    } = body;

    // Get current user
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
        organizationId: true,
        fullName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user basic info
    const updateUserData: any = {};
    if (firstName !== undefined) updateUserData.firstName = firstName;
    if (lastName !== undefined) {
      updateUserData.lastName = lastName;
      if (firstName !== undefined) {
        updateUserData.fullName = `${firstName} ${lastName}`;
      }
    }
    if (phone !== undefined) updateUserData.phone = phone;
    if (avatarUrl !== undefined) updateUserData.avatarUrl = avatarUrl;
    if (coverImageUrl !== undefined) updateUserData.coverImageUrl = coverImageUrl;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateUserData,
      });
    }

    // Update alumni profile
    if (user.userType === UserType.alumni) {
      const alumniUpdateData: any = {};
      if (headline !== undefined) alumniUpdateData.headline = headline;
      if (bio !== undefined) alumniUpdateData.bio = bio;
      if (city !== undefined) alumniUpdateData.city = city;
      if (countryCode !== undefined) alumniUpdateData.countryCode = countryCode;
      if (degree !== undefined) alumniUpdateData.degree = degree;
      if (major !== undefined) alumniUpdateData.major = major;
      if (minor !== undefined) alumniUpdateData.minor = minor;
      if (graduationYear !== undefined) alumniUpdateData.graduationYear = graduationYear;
      if (gpa !== undefined) alumniUpdateData.gpa = gpa;
      if (currentCompany !== undefined) alumniUpdateData.currentCompany = currentCompany;
      if (currentTitle !== undefined) alumniUpdateData.currentTitle = currentTitle;
      if (yearsOfExperience !== undefined) alumniUpdateData.yearsOfExperience = yearsOfExperience;
      if (industry !== undefined) alumniUpdateData.industry = industry;
      if (isOpenToWork !== undefined) alumniUpdateData.isOpenToWork = isOpenToWork;
      if (isMentorAvailable !== undefined) alumniUpdateData.isMentorAvailable = isMentorAvailable;
      if (mentorshipTopics !== undefined) alumniUpdateData.mentorshipTopics = mentorshipTopics;
      if (linkedinUrl !== undefined) alumniUpdateData.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) alumniUpdateData.githubUrl = githubUrl;
      if (twitterUrl !== undefined) alumniUpdateData.twitterUrl = twitterUrl;
      if (websiteUrl !== undefined) alumniUpdateData.websiteUrl = websiteUrl;
      if (resumeUrl !== undefined) alumniUpdateData.resumeUrl = resumeUrl;

      if (Object.keys(alumniUpdateData).length > 0) {
        await prisma.alumniProfile.upsert({
          where: { userId: user.id },
          update: alumniUpdateData,
          create: {
            userId: user.id,
            organizationId: user.organizationId!,
            ...alumniUpdateData,
          },
        });
      }
    }

    // Update student profile
    if (user.userType === UserType.student) {
      const studentUpdateData: any = {};
      if (headline !== undefined) studentUpdateData.headline = headline;
      if (bio !== undefined) studentUpdateData.bio = bio;
      if (city !== undefined) studentUpdateData.city = city;
      if (countryCode !== undefined) studentUpdateData.countryCode = countryCode;
      if (major !== undefined) studentUpdateData.major = major;
      if (minor !== undefined) studentUpdateData.minor = minor;
      if (enrollmentYear !== undefined) studentUpdateData.enrollmentYear = enrollmentYear;
      if (expectedGraduation !== undefined) studentUpdateData.expectedGraduation = expectedGraduation;
      if (gpa !== undefined) studentUpdateData.gpa = gpa;
      if (department !== undefined) studentUpdateData.department = department;
      if (isSeekingMentorship !== undefined) studentUpdateData.isSeekingMentorship = isSeekingMentorship;
      if (isSeekingInternship !== undefined) studentUpdateData.isSeekingInternship = isSeekingInternship;
      if (isSeekingFulltime !== undefined) studentUpdateData.isSeekingFulltime = isSeekingFulltime;
      if (linkedinUrl !== undefined) studentUpdateData.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) studentUpdateData.githubUrl = githubUrl;
      if (portfolioUrl !== undefined) studentUpdateData.portfolioUrl = portfolioUrl;

      if (Object.keys(studentUpdateData).length > 0) {
        await prisma.studentProfile.upsert({
          where: { userId: user.id },
          update: studentUpdateData,
          create: {
            userId: user.id,
            organizationId: user.organizationId!,
            ...studentUpdateData,
          },
        });
      }
    }

    // Update skills
    if (skills !== undefined && Array.isArray(skills)) {
      await updateUserSkills(user.id, user.organizationId as string, user.userType, skills);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId as string,
        actorId: user.id,
        action: "profile.updated",
        entityType: "user",
        entityId: user.id,
        entityLabel: user.fullName,
        afterState: { updatedFields: Object.keys(body) },
        severity: "info",
      },
    });

    // Fetch updated profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        alumniProfile: true,
        studentProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (err: any) {
    console.error("Profile PUT failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user: any): number {
  const criteria = [];
  
  // Basic info
  if (user.firstName) criteria.push(true);
  if (user.fullName) criteria.push(true);
  if (user.avatarUrl) criteria.push(true);
  if (user.emailVerified) criteria.push(true);
  
  if (user.userType === UserType.alumni && user.alumniProfile) {
    if (user.alumniProfile.headline) criteria.push(true);
    if (user.alumniProfile.bio) criteria.push(true);
    if (user.alumniProfile.graduationYear) criteria.push(true);
    if (user.alumniProfile.degree) criteria.push(true);
    if (user.alumniProfile.major) criteria.push(true);
    if (user.alumniProfile.currentCompany) criteria.push(true);
    if (user.alumniProfile.currentTitle) criteria.push(true);
    if (user.alumniProfile.industry) criteria.push(true);
    if (user.alumniProfile.profileSkills?.length > 0) criteria.push(true);
    if (user.alumniProfile.workHistory?.length > 0) criteria.push(true);
    if (user.alumniProfile.linkedinUrl) criteria.push(true);
    if (user.alumniProfile.city) criteria.push(true);
  } else if (user.userType === UserType.student && user.studentProfile) {
    if (user.studentProfile.headline) criteria.push(true);
    if (user.studentProfile.bio) criteria.push(true);
    if (user.studentProfile.expectedGraduation) criteria.push(true);
    if (user.studentProfile.major) criteria.push(true);
    if (user.studentProfile.profileSkills?.length > 0) criteria.push(true);
    if (user.studentProfile.linkedinUrl) criteria.push(true);
    if (user.studentProfile.city) criteria.push(true);
  }
  
  const totalFields = 15;
  return Math.min(100, Math.round((criteria.length / totalFields) * 100));
}

// Helper function to update user skills
async function updateUserSkills(
  userId: string,
  organizationId: string,
  userType: string,
  skills: Array<{ name: string; proficiencyLevel?: number; yearsExperience?: number }>
) {
  const ownerType = userType === UserType.alumni ? "alumni_profile" : "student_profile";
  
  // Get existing skills
  const existingSkills = await prisma.profileSkill.findMany({
    where: { ownerId: userId, ownerType },
    include: { skill: true },
  });
  
  const existingSkillNames = new Set(existingSkills.map(ps => ps.skill.name.toLowerCase()));
  
  for (const skillInput of skills) {
    const skillName = typeof skillInput === 'string' ? skillInput : skillInput.name;
    const proficiencyLevel = typeof skillInput === 'object' ? skillInput.proficiencyLevel : undefined;
    const yearsExperience = typeof skillInput === 'object' ? skillInput.yearsExperience : undefined;
    
    // Find or create skill
    let skill = await prisma.skill.findFirst({
      where: {
        OR: [
          { name: { equals: skillName, mode: 'insensitive' } },
          { normalizedName: skillName.toLowerCase() },
        ],
      },
    });
    
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: skillName,
          normalizedName: skillName.toLowerCase(),
          slug: skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          usageCount: 1,
        },
      });
    } else {
      await prisma.skill.update({
        where: { id: skill.id },
        data: { usageCount: { increment: 1 } },
      });
    }
    
    // Create or update profile skill
    if (!existingSkillNames.has(skill.name.toLowerCase())) {
      await prisma.profileSkill.create({
        data: {
          ownerId: userId,
          ownerType,
          organizationId,
          skillId: skill.id,
          proficiencyLevel: proficiencyLevel || null,
          yearsExperience: yearsExperience || null,
        },
      });
    } else if (proficiencyLevel || yearsExperience) {
      await prisma.profileSkill.updateMany({
        where: {
          ownerId: userId,
          ownerType,
          skillId: skill.id,
        },
        data: {
          ...(proficiencyLevel && { proficiencyLevel }),
          ...(yearsExperience && { yearsExperience }),
        },
      });
    }
  }
}