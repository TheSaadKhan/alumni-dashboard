"use server";

import { prisma } from "@/lib/prisma";
import { UserType, UserStatus, RoleScope } from "@/lib/generated/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userType = formData.get("userType") as UserType;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const orgSlugOrId = formData.get("organizationId") as string;
  
  // Find organization
  let orgId = orgSlugOrId;
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { id: orgSlugOrId },
        { slug: orgSlugOrId }
      ]
    }
  });

  if (!org) {
    throw new Error("Organization not found.");
  }
  
  orgId = org.id;

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: userId,
      },
    },
  });

  if (!user) {
    throw new Error("User record not found.");
  }

  const needsApproval = userType === UserType.student || !org.isVerified;

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      fullName: `${firstName} ${lastName}`,
      userType: userType,
      status: needsApproval ? UserStatus.pending : UserStatus.active,
      organizationId: orgId,
    },
  });

  // Profiles
  if (userType === UserType.alumni) {
    const graduationYear = formData.get("graduationYear");
    await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      update: {
          graduationYear: graduationYear ? parseInt(graduationYear as string) : null,
      },
      create: {
        userId: user.id,
        organizationId: orgId,
        graduationYear: graduationYear ? parseInt(graduationYear as string) : null,
        isVerified: !needsApproval,
      },
    });
  } else if (userType === UserType.student) {
    const expectedGraduation = formData.get("expectedGraduation");
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
          expectedGraduation: expectedGraduation ? parseInt(expectedGraduation as string) : null,
      },
      create: {
        userId: user.id,
        organizationId: orgId,
        expectedGraduation: expectedGraduation ? parseInt(expectedGraduation as string) : null,
        isVerified: false,
      },
    });
  }

  if (needsApproval) {
    await prisma.verificationRequest.create({
        data: {
            organizationId: orgId,
            userId: user.id,
            targetType: "join_request",
            status: "pending",
            notes: `${userType} join request.`,
        }
    });
  } else {
    const defaultRole = await prisma.role.findFirst({
      where: {
        organizationId: orgId,
        isDefault: true,
        slug: userType.toLowerCase() === 'alumni' ? 'alumni' : 'member'
      }
    });

    if (defaultRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId_organizationId: { userId: user.id, roleId: defaultRole.id, organizationId: orgId } },
        update: {},
        create: {
          userId: user.id,
          roleId: defaultRole.id,
          organizationId: orgId,
          grantedBy: user.id,
        }
      });
    }
  }

  // Clerk Metadata
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      userType: userType,
      organizationId: orgId,
      onboardingCompleted: true,
      status: needsApproval ? "pending" : "active"
    }
  });

  return { success: true, slug: org.slug };
}