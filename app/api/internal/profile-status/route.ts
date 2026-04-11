// app/api/profile-status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authResult = await auth();
    const clerkId = authResult.userId || req.headers.get("x-user-id");

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user profile
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
            isActive: true,
            isVerified: true,
            planTier: true,
          },
        },
        alumniProfile: {
          select: {
            id: true,
            headline: true,
            graduationYear: true,
            currentCompany: true,
            currentTitle: true,
            isVerified: true,
            profileCompleteness: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            headline: true,
            expectedGraduation: true,
            major: true,
            isVerified: true,
            profileCompleteness: true,
          },
        },
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
                scope: true,
                priority: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        hasProfile: false,
        isProfileComplete: false,
        userType: null,
        hasOrganization: false,
        needsOnboarding: true,
        message: "User profile not found. Please complete onboarding.",
      });
    }

    // Check if user has an active organization association
    const hasOrganization = !!(user.organizationId || user.organization);
    
    // Get active organization (if any)
    const activeOrganization = user.organization || null;

    // Check if profile is complete based on user type
    let isProfileComplete = user.status === UserStatus.active;
    let profileCompleteness = 0;
    
    if (user.userType === UserType.alumni && user.alumniProfile) {
      profileCompleteness = user.alumniProfile.profileCompleteness;
      isProfileComplete = isProfileComplete && profileCompleteness >= 70;
    } else if (user.userType === UserType.student && user.studentProfile) {
      profileCompleteness = user.studentProfile.profileCompleteness;
      isProfileComplete = isProfileComplete && profileCompleteness >= 70;
    }

    // Check if user has required roles
    const hasRoles = user.userRoles.length > 0;
    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSuperAdmin = user.userType === UserType.super_admin;

    // Check if user has completed required steps
    const missingRequirements = [];
    
    if (!user.emailVerified) {
      missingRequirements.push("verify_email");
    }
    
    if (!user.firstName || !user.fullName) {
      missingRequirements.push("complete_name");
    }
    
    if (!hasOrganization) {
      missingRequirements.push("join_organization");
    }
    
    if (user.userType === UserType.alumni && user.alumniProfile) {
      if (!user.alumniProfile.graduationYear) {
        missingRequirements.push("add_graduation_year");
      }
      if (!user.alumniProfile.currentCompany && !user.alumniProfile.currentTitle) {
        missingRequirements.push("add_work_info");
      }
    } else if (user.userType === UserType.student && user.studentProfile) {
      if (!user.studentProfile.expectedGraduation) {
        missingRequirements.push("add_graduation_year");
      }
      if (!user.studentProfile.major) {
        missingRequirements.push("add_major");
      }
    }

    // Get pending tasks count
    const pendingTasks = await getPendingTasksCount(user.id, user.organizationId);

    // Get next steps based on profile completion
    const nextSteps = getNextSteps(user, missingRequirements, profileCompleteness);

    return NextResponse.json({
      success: true,
      hasProfile: true,
      isProfileComplete,
      profileCompleteness,
      userType: user.userType,
      hasOrganization,
      needsOnboarding: !isProfileComplete,
      
      // User details
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
      },
      
      // Organization details
      organization: activeOrganization ? {
        id: activeOrganization.id,
        name: activeOrganization.name,
        slug: activeOrganization.slug,
        logoUrl: activeOrganization.logoUrl,
        isActive: activeOrganization.isActive,
        isVerified: activeOrganization.isVerified,
        planTier: activeOrganization.planTier,
      } : null,
      
      // Role information
      roles: {
        list: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
          scope: ur.role.scope,
          priority: ur.role.priority,
        })),
        isAdmin,
        isSuperAdmin,
        hasRoles,
      },
      
      // Profile data based on user type
      profile: user.userType === UserType.alumni && user.alumniProfile ? {
        type: "alumni",
        headline: user.alumniProfile.headline,
        graduationYear: user.alumniProfile.graduationYear,
        currentCompany: user.alumniProfile.currentCompany,
        currentTitle: user.alumniProfile.currentTitle,
        isVerified: user.alumniProfile.isVerified,
        profileCompleteness: user.alumniProfile.profileCompleteness,
      } : user.userType === UserType.student && user.studentProfile ? {
        type: "student",
        headline: user.studentProfile.headline,
        expectedGraduation: user.studentProfile.expectedGraduation,
        major: user.studentProfile.major,
        isVerified: user.studentProfile.isVerified,
        profileCompleteness: user.studentProfile.profileCompleteness,
      } : null,
      
      // Missing requirements and next steps
      missingRequirements,
      pendingTasks,
      nextSteps,
      
      // Onboarding suggestions
      onboardingSuggestions: getOnboardingSuggestions(user, missingRequirements, profileCompleteness),
    });
  } catch (err: any) {
    console.error("Profile status error:", err);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: err.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to get pending tasks count
async function getPendingTasksCount(userId: string, organizationId: string | null): Promise<number> {
  let count = 0;
  
  // Count pending connection requests
  const pendingConnections = await prisma.connection.count({
    where: {
      recipientId: userId,
      status: "pending",
    },
  });
  count += pendingConnections;
  
  // Count pending mentorship requests
  const pendingMentorship = await prisma.mentorshipRequest.count({
    where: {
      alumniId: userId,
      status: "pending",
    },
  });
  count += pendingMentorship;
  
  // Count unread notifications
  const unreadNotifications = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
  count += Math.min(unreadNotifications, 5); // Cap at 5
  
  if (organizationId) {
    // Count pending invitations sent (for admins)
    const pendingInvites = await prisma.orgInvitation.count({
      where: {
        organizationId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });
    count += pendingInvites;
  }
  
  return count;
}

// Helper function to get next steps
function getNextSteps(user: any, missingRequirements: string[], profileCompleteness: number): Array<{ step: string; description: string; action: string; priority: "high" | "medium" | "low" }> {
  const steps: Array<{ step: string; description: string; action: string; priority: "high" | "medium" | "low" }> = [];
  
  if (missingRequirements.includes("verify_email")) {
    steps.push({
      step: "Verify Email",
      description: "Verify your email address to unlock all features",
      action: "/settings/email",
      priority: "high",
    });
  }
  
  if (missingRequirements.includes("complete_name")) {
    steps.push({
      step: "Complete Profile",
      description: "Add your full name to complete your profile",
      action: "/dashboard/profile/edit",
      priority: "high",
    });
  }
  
  if (missingRequirements.includes("join_organization")) {
    steps.push({
      step: "Join Organization",
      description: "Join an organization to connect with your community",
      action: "/onboarding",
      priority: "high",
    });
  }
  
  if (profileCompleteness < 30) {
    steps.push({
      step: "Complete Basic Profile",
      description: "Add your basic information to get started",
      action: "/dashboard/profile/edit",
      priority: "high",
    });
  } else if (profileCompleteness < 60) {
    steps.push({
      step: "Enhance Your Profile",
      description: "Add work experience, education, and skills",
      action: "/dashboard/profile/edit",
      priority: "medium",
    });
  } else if (profileCompleteness < 90) {
    steps.push({
      step: "Add Social Links",
      description: "Connect your social profiles to expand your network",
      action: "/dashboard/profile/edit#social",
      priority: "low",
    });
  }
  
  if (user.userType === UserType.alumni && !user.alumniProfile?.isMentorAvailable) {
    steps.push({
      step: "Become a Mentor",
      description: "Share your experience and guide students",
      action: "/dashboard/profile/edit#mentorship",
      priority: "medium",
    });
  }
  
  if (user.userType === UserType.student && !user.studentProfile?.isSeekingMentorship) {
    steps.push({
      step: "Find a Mentor",
      description: "Connect with experienced alumni for guidance",
      action: "/dashboard/mentorship",
      priority: "medium",
    });
  }
  
  return steps.slice(0, 5); // Return top 5 steps
}

// Helper function to get onboarding suggestions
function getOnboardingSuggestions(user: any, missingRequirements: string[], profileCompleteness: number): Array<{ title: string; description: string; action: string; completed: boolean }> {
  const suggestions = [
    {
      title: "Complete Your Profile",
      description: "Add your photo, bio, and professional details",
      action: "/dashboard/profile/edit",
      completed: profileCompleteness >= 50,
    },
    {
      title: "Connect with Alumni",
      description: "Start building your professional network",
      action: "/dashboard/network",
      completed: false,
    },
    {
      title: "Explore Opportunities",
      description: "Browse jobs and events tailored for you",
      action: "/dashboard/jobs",
      completed: false,
    },
  ];
  
  if (user.userType === UserType.alumni) {
    suggestions.push({
      title: "Become a Mentor",
      description: "Share your expertise with students",
      action: "/dashboard/profile/edit#mentorship",
      completed: !!user.alumniProfile?.isMentorAvailable,
    });
  } else if (user.userType === UserType.student) {
    suggestions.push({
      title: "Find a Mentor",
      description: "Get guidance from experienced alumni",
      action: "/dashboard/mentorship",
      completed: !!user.studentProfile?.isSeekingMentorship,
    });
  }
  
  return suggestions;
}