"use server";

import { prisma } from "@/lib/prisma";
import { UserType, UserStatus, RoleScope } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userType = formData.get("userType") as UserType;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const orgSlugOrId = formData.get("organizationId") as string;
  
  // Find organization - handle slug or ID
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
    throw new Error("Organization not found. Please provide a valid organization.");
  }
  
  orgId = org.id;

  // Find user by Clerk ID stored in metadata
  const user = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: userId,
      },
    },
  });

  if (!user) {
    throw new Error("User record not found to onboard.");
  }

  // Update user data and activate
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      fullName: `${firstName} ${lastName}`,
      userType: userType,
      status: UserStatus.active,
      organizationId: orgId,
    },
  });

  // Create profile based on type
  if (userType === UserType.alumni) {
    const graduationYear = formData.get("graduationYear");
    await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        organizationId: orgId,
        graduationYear: graduationYear ? parseInt(graduationYear as string) : null,
      },
    });
  } else if (userType === UserType.student) {
    const expectedGraduation = formData.get("expectedGraduation");
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        organizationId: orgId,
        expectedGraduation: expectedGraduation ? parseInt(expectedGraduation as string) : null,
      },
    });
  }

  // Assign default role based on user type
  const defaultRole = await prisma.role.findFirst({
    where: {
      organizationId: orgId,
      isDefault: true,
      scope: RoleScope.organization,
      OR: [
        { slug: userType.toLowerCase() },
        { slug: "member" }
      ]
    }
  });

  if (defaultRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: defaultRole.id,
        organizationId: orgId,
        grantedBy: user.id, // Self-granted during onboarding
        grantedReason: "Automatic role assignment during onboarding",
      }
    });
  }

  // Check if organization needs admin assignment (first user)
  const userCount = await prisma.user.count({
    where: { organizationId: orgId }
  });

  if (userCount === 1) {
    // First user becomes admin
    const adminRole = await prisma.role.findFirst({
      where: {
        organizationId: orgId,
        slug: "admin",
        scope: RoleScope.organization,
      }
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
          organizationId: orgId,
          grantedBy: user.id,
          grantedReason: "First user - automatic admin assignment",
        }
      });
    }
  }

  redirect("/dashboard");
}