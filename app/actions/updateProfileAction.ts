// /app/actions/updateProfileAction.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserType } from "@/lib/generated/prisma";
import { syncClerkUser } from "@/lib/db/users";

export type UpdateProfilePayload = {
  // Basic Info
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  
  // Profile Info
  degree?: string;
  major?: string;
  minor?: string;
  graduationYear?: number | null;
  enrollmentYear?: number | null;
  expectedGraduation?: number | null;
  gpa?: number | null;
  bio?: string | null;
  headline?: string | null;
  
  // Location
  city?: string | null;
  countryCode?: string | null;
  stateCode?: string | null;
  
  // Work & Career (Alumni)
  company?: string | null;
  currentTitle?: string | null;
  industry?: string | null;
  yearsOfExperience?: number | null;
  employmentType?: string | null;
  isOpenToWork?: boolean;
  isMentorAvailable?: boolean;
  mentorshipTopics?: string[];
  mentorshipSlots?: number;
  
  // Student Career Goals
  isSeekingInternship?: boolean;
  isSeekingFulltime?: boolean;
  isSeekingMentorship?: boolean;
  
  // Social Links
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  portfolioUrl?: string | null;
  
  // Skills
  skills?: Array<{ name: string; proficiencyLevel?: number; yearsExperience?: number }> | string[];
  
  // Work History (for adding new entries)
  workHistory?: Array<{
    company: string;
    title: string;
    employmentType?: string;
    location?: string;
    isRemote?: boolean;
    isCurrent?: boolean;
    startedAt: Date;
    endedAt?: Date | null;
    description?: string;
  }>;
  
  // Education History (for adding new entries)
  educationHistory?: Array<{
    institution: string;
    degreeType?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
  }>;
};

/**
 * Ensures country exists in the lookup table to prevent FK violations.
 */
async function ensureCountryExists(tx: any, code: string) {
  if (!code || code.length !== 2) return;
  const upperCode = code.toUpperCase();
  const exists = await tx.country.findUnique({ where: { code: upperCode } });
  if (!exists) {
    // If it doesn't exist, we create a placeholder so the FK doesn't fail.
    // In a real app, you'd want a full seed or mapping.
    await tx.country.create({
      data: {
        code: upperCode,
        name: upperCode, // Default to code as name
        isActive: true
      }
    });
  }
}

/**
 * Server action: update profile (User + AlumniProfile/StudentProfile)
 */
export async function updateProfileAction(payload: UpdateProfilePayload) {
  // Verify authentication
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findFirst({
    where: { 
      metadata: { 
        path: ["clerkId"], 
        equals: clerkId 
      } 
    },
    include: {
      alumniProfile: true,
      studentProfile: true,
    }
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Clerk authentication failed.");
    }
    
    await syncClerkUser({
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: payload.firstName || clerkUser.firstName || "",
      lastName: payload.lastName || clerkUser.lastName || "",
      imageUrl: clerkUser.imageUrl,
    });
    
    user = await prisma.user.findFirst({
      where: { 
        metadata: { 
          path: ["clerkId"], 
          equals: clerkId 
        } 
      },
      include: {
        alumniProfile: true,
        studentProfile: true,
      }
    });
    
    if (!user) {
      throw new Error("Failed to create user profile in database.");
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Prevent FK violations by ensuring country exists
      if (payload.countryCode) {
        await ensureCountryExists(tx, payload.countryCode);
      }

      // 1. Update core User fields
      const userUpdateData: any = {};
      const currentMetadata = (user.metadata as any) || {};

      if (payload.firstName || payload.lastName || payload.fullName) {
        if (payload.firstName) userUpdateData.firstName = payload.firstName;
        if (payload.lastName && payload.firstName) {
          userUpdateData.fullName = `${payload.firstName} ${payload.lastName}`;
        } else if (payload.fullName) {
          userUpdateData.fullName = payload.fullName;
        } else if (payload.firstName) {
          const currentUserVal = await tx.user.findUnique({
            where: { id: user.id },
            select: { fullName: true }
          });
          const existingLast =
            (currentUserVal?.fullName?.split(" ").slice(1).join(" ") || "").trim() ||
            (currentMetadata?.lastName || "");
          userUpdateData.fullName = `${payload.firstName} ${existingLast}`.trim();
        }
      }
      
      if (payload.phone !== undefined) userUpdateData.phone = payload.phone;
      
      userUpdateData.metadata = {
        ...currentMetadata,
        ...(payload.websiteUrl !== undefined && { websiteUrl: payload.websiteUrl }),
        ...(payload.linkedinUrl !== undefined && { linkedinUrl: payload.linkedinUrl }),
        ...(payload.githubUrl !== undefined && { githubUrl: payload.githubUrl }),
        ...(payload.twitterUrl !== undefined && { twitterUrl: payload.twitterUrl }),
        profile: {
          ...(currentMetadata.profile || {}),
          ...(payload.bio !== undefined && { bio: payload.bio }),
          ...(payload.headline !== undefined && { headline: payload.headline }),
          ...(payload.city !== undefined && { city: payload.city }),
          ...(payload.countryCode !== undefined && { countryCode: payload.countryCode }),
          ...(payload.stateCode !== undefined && { stateCode: payload.stateCode }),
        }
      };

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          ...userUpdateData,
          status: "active",
        },
      });

      if (!user.organizationId || user.userType === UserType.super_admin) {
        return { updatedUser, updatedProfile: null };
      }

      // 2. Update or create profile based on userType
      let updatedProfile = null;
      const baseCountryCode = payload.countryCode?.toUpperCase().slice(0, 2) || null;
      
      if (user.userType === UserType.alumni) {
        const alumniData: any = {
          userId: user.id,
          organizationId: user.organizationId,
        };
        
        if (payload.degree !== undefined) alumniData.degree = payload.degree;
        if (payload.major !== undefined) alumniData.major = payload.major;
        if (payload.minor !== undefined) alumniData.minor = payload.minor;
        if (payload.graduationYear !== undefined) alumniData.graduationYear = payload.graduationYear;
        if (payload.gpa !== undefined) alumniData.gpa = payload.gpa;
        if (payload.bio !== undefined) alumniData.bio = payload.bio;
        if (payload.headline !== undefined) alumniData.headline = payload.headline;
        if (payload.company !== undefined) alumniData.currentCompany = payload.company;
        if (payload.currentTitle !== undefined) alumniData.currentTitle = payload.currentTitle;
        if (payload.industry !== undefined) alumniData.industry = payload.industry;
        if (payload.yearsOfExperience !== undefined) alumniData.yearsOfExperience = payload.yearsOfExperience;
        if (payload.city !== undefined) alumniData.city = payload.city;
        if (baseCountryCode) alumniData.countryCode = baseCountryCode;
        if (payload.linkedinUrl !== undefined) alumniData.linkedinUrl = payload.linkedinUrl;
        if (payload.githubUrl !== undefined) alumniData.githubUrl = payload.githubUrl;
        if (payload.isOpenToWork !== undefined) alumniData.isOpenToWork = payload.isOpenToWork;
        if (payload.isMentorAvailable !== undefined) alumniData.isMentorAvailable = payload.isMentorAvailable;
        if (payload.mentorshipSlots !== undefined) alumniData.mentorshipSlots = payload.mentorshipSlots;
        if (payload.mentorshipTopics !== undefined) alumniData.mentorshipTopics = payload.mentorshipTopics;
        
        updatedProfile = await tx.alumniProfile.upsert({
          where: { userId: user.id },
          create: alumniData,
          update: Object.fromEntries(
            Object.entries(alumniData).filter(([key]) => key !== 'userId' && key !== 'organizationId')
          ),
        });
        
        await updateProfileCompleteness(tx, user.id, user.userType);
        
      } else if (user.userType === UserType.student) {
        const studentData: any = {
          userId: user.id,
          organizationId: user.organizationId,
        };
        
        if (payload.major !== undefined) studentData.major = payload.major;
        if (payload.minor !== undefined) studentData.minor = payload.minor;
        if (payload.enrollmentYear !== undefined) studentData.enrollmentYear = payload.enrollmentYear;
        if (payload.expectedGraduation !== undefined) studentData.expectedGraduation = payload.expectedGraduation;
        if (payload.gpa !== undefined) studentData.gpa = payload.gpa;
        if (payload.bio !== undefined) studentData.bio = payload.bio;
        if (payload.headline !== undefined) studentData.headline = payload.headline;
        if (payload.city !== undefined) studentData.city = payload.city;
        if (baseCountryCode) studentData.countryCode = baseCountryCode;
        if (payload.linkedinUrl !== undefined) studentData.linkedinUrl = payload.linkedinUrl;
        if (payload.githubUrl !== undefined) studentData.githubUrl = payload.githubUrl;
        if (payload.isOpenToWork !== undefined) {
          studentData.isSeekingInternship = payload.isOpenToWork;
          studentData.isSeekingFulltime = payload.isOpenToWork;
        }
        if (payload.isMentorAvailable !== undefined) studentData.isSeekingMentorship = payload.isMentorAvailable;
        
        updatedProfile = await tx.studentProfile.upsert({
          where: { userId: user.id },
          create: studentData,
          update: Object.fromEntries(
            Object.entries(studentData).filter(([key]) => key !== 'userId' && key !== 'organizationId')
          ),
        });
        
        await updateProfileCompleteness(tx, user.id, user.userType);
      }

      if (payload.skills && Array.isArray(payload.skills) && payload.skills.length > 0) {
        await updateUserSkills(tx, user.id, user.organizationId, payload.skills);
      }

      if (payload.workHistory && Array.isArray(payload.workHistory) && user.userType === UserType.alumni) {
        await addWorkHistoryEntries(tx, user.id, user.organizationId, payload.workHistory);
      }

      if (payload.educationHistory && Array.isArray(payload.educationHistory)) {
        await addEducationEntries(tx, user.id, user.organizationId, payload.educationHistory);
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "profile.updated",
          entityType: user.userType === UserType.alumni ? "alumni_profile" : "student_profile",
          entityId: user.id,
          afterState: { updatedFields: Object.keys(payload) },
          severity: "info",
        },
      });

      return { updatedUser, updatedProfile };
    });

    return {
      success: true,
      user: result.updatedUser,
      profile: result.updatedProfile,
    };
    
  } catch (err: any) {
    console.error("updateProfileAction error:", err);
    throw new Error("Failed to update profile: " + err.message);
  }
}

/* -------------------------------------------
   HELPER FUNCTIONS
-------------------------------------------- */

async function updateProfileCompleteness(
  tx: any,
  userId: string,
  userType: UserType
): Promise<void> {
  let completeness = 0;
  const totalFields = 15;
  
  if (userType === UserType.alumni) {
    const profile = await tx.alumniProfile.findUnique({ where: { userId } });
    if (profile) {
      if (profile.headline) completeness += 1;
      if (profile.bio) completeness += 1;
      if (profile.degree) completeness += 1;
      if (profile.major) completeness += 1;
      if (profile.graduationYear) completeness += 1;
      if (profile.currentCompany) completeness += 1;
      if (profile.linkedinUrl) completeness += 1;
      if (profile.city) completeness += 1;
      if (profile.countryCode) completeness += 1;
      
      const skillCount = await tx.profileSkill.count({
        where: { ownerId: userId, ownerType: "alumni_profile" }
      });
      if (skillCount > 0) completeness += 2;
      
      const workCount = await tx.alumniWorkHistory.count({
        where: { alumniProfileId: profile.id }
      });
      if (workCount > 0) completeness += 2;
      
      const percentage = Math.floor((completeness / totalFields) * 100);
      await tx.alumniProfile.update({
        where: { userId },
        data: { profileCompleteness: Math.min(percentage, 100) }
      });
    }
  } else if (userType === UserType.student) {
    const profile = await tx.studentProfile.findUnique({ where: { userId } });
    if (profile) {
      if (profile.headline) completeness += 1;
      if (profile.bio) completeness += 1;
      if (profile.major) completeness += 1;
      if (profile.expectedGraduation) completeness += 1;
      if (profile.linkedinUrl) completeness += 1;
      if (profile.city) completeness += 1;
      if (profile.countryCode) completeness += 1;
      
      const skillCount = await tx.profileSkill.count({
        where: { ownerId: userId, ownerType: "student_profile" }
      });
      if (skillCount > 0) completeness += 2;
      
      const percentage = Math.floor((completeness / totalFields) * 100);
      await tx.studentProfile.update({
        where: { userId },
        data: { profileCompleteness: Math.min(percentage, 100) }
      });
    }
  }
}

async function updateUserSkills(
  tx: any,
  userId: string,
  organizationId: string,
  skills: Array<{ name: string; proficiencyLevel?: number; yearsExperience?: number }> | string[]
): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { userType: true }
  });
  
  const ownerType = user.userType === UserType.alumni ? "alumni_profile" : "student_profile";
  const existingSkills = await tx.profileSkill.findMany({
    where: { ownerId: userId, ownerType },
    include: { skill: true }
  });
  const existingSkillNames = new Set(existingSkills.map((ps: any) => ps.skill.name.toLowerCase()));
  
  for (const skillInput of skills) {
    const skillName = typeof skillInput === 'string' ? skillInput : skillInput.name;
    const proficiencyLevel = typeof skillInput === 'object' ? skillInput.proficiencyLevel : undefined;
    const yearsExperience = typeof skillInput === 'object' ? skillInput.yearsExperience : undefined;
    
    let skill = await tx.skill.findFirst({
      where: { 
        OR: [
          { name: { equals: skillName, mode: 'insensitive' } },
          { normalizedName: skillName.toLowerCase() }
        ]
      }
    });
    
    if (!skill) {
      skill = await tx.skill.create({
        data: {
          name: skillName,
          normalizedName: skillName.toLowerCase(),
          slug: skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          usageCount: 1
        }
      });
    } else {
      await tx.skill.update({
        where: { id: skill.id },
        data: { usageCount: { increment: 1 } }
      });
    }
    
    if (!existingSkillNames.has(skill.name.toLowerCase())) {
      await tx.profileSkill.create({
        data: {
          ownerId: userId,
          ownerType,
          organizationId,
          skillId: skill.id,
          proficiencyLevel: proficiencyLevel || null,
          yearsExperience: yearsExperience || null
        }
      });
    } else if (proficiencyLevel || yearsExperience) {
      await tx.profileSkill.updateMany({
        where: { ownerId: userId, ownerType, skillId: skill.id },
        data: {
          ...(proficiencyLevel && { proficiencyLevel }),
          ...(yearsExperience && { yearsExperience })
        }
      });
    }
  }
}

async function addWorkHistoryEntries(
  tx: any,
  userId: string,
  organizationId: string,
  workHistory: Array<{
    company: string;
    title: string;
    employmentType?: string;
    location?: string;
    isRemote?: boolean;
    isCurrent?: boolean;
    startedAt: Date;
    endedAt?: Date | null;
    description?: string;
  }>
): Promise<void> {
  const alumniProfile = await tx.alumniProfile.findUnique({ where: { userId } });
  if (!alumniProfile) throw new Error("Alumni profile not found");
  
  for (const work of workHistory) {
    await tx.alumniWorkHistory.create({
      data: {
        alumniProfileId: alumniProfile.id,
        organizationId,
        company: work.company,
        title: work.title,
        employmentType: work.employmentType,
        location: work.location,
        isRemote: work.isRemote || false,
        isCurrent: work.isCurrent || false,
        startedAt: work.startedAt,
        endedAt: work.endedAt || null,
        description: work.description
      }
    });
  }
}

async function addEducationEntries(
  tx: any,
  userId: string,
  organizationId: string,
  educationHistory: Array<{
    institution: string;
    degreeType?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
  }>
): Promise<void> {
  for (const edu of educationHistory) {
    await tx.profileEducation.create({
      data: {
        ownerId: userId,
        ownerType: "user",
        organizationId,
        institution: edu.institution,
        degreeType: edu.degreeType,
        fieldOfStudy: edu.fieldOfStudy,
        startYear: edu.startYear,
        endYear: edu.endYear,
        isCurrent: edu.isCurrent || false,
        grade: edu.grade,
        description: edu.description
      }
    });
  }
}

export async function getProfileAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  
  const user = await prisma.user.findFirst({
    where: { metadata: { path: ["clerkId"], equals: clerkId } },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
      alumniProfile: { include: { workHistory: { orderBy: { startedAt: 'desc' } } } },
      studentProfile: true,
      userRoles: { include: { role: true } }
    }
  });
  
  if (!user) throw new Error("User not found");
  
  const educationHistory = await prisma.profileEducation.findMany({
    where: { ownerId: user.id },
    orderBy: { startYear: 'desc' }
  });
  
  const profileSkills = await prisma.profileSkill.findMany({
    where: { ownerId: user.id },
    include: { skill: true }
  });
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      fullName: user.fullName,
      phone: user.phone,
      userType: user.userType,
      status: user.status,
      createdAt: user.createdAt,
      organization: user.organization,
      roles: user.userRoles.map(ur => ur.role),
      profile: user.alumniProfile || user.studentProfile,
      skills: profileSkills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        proficiencyLevel: ps.proficiencyLevel,
        yearsExperience: ps.yearsExperience,
        endorsedCount: ps.endorsedCount
      })),
      workHistory: user.alumniProfile?.workHistory || [],
      educationHistory,
      metadata: user.metadata
    }
  };
}