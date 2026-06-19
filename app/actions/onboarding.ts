"use server";

import { prisma } from "@/lib/prisma";
import { UserType, UserStatus, InviteStatus } from "@/lib/generated/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export type OnboardingData = {
  userType: UserType;
  organizationId: string | null;
  inviteToken?: string | null;
  firstName?: string;
  lastName?: string;
  graduationYear?: number | string | null;
  expectedGraduation?: number | string | null;
  headline?: string | null;
  bio?: string | null;
  degree?: string | null;
  major?: string | null;
  city?: string | null;
  countryCode?: string | null;
  currentCompany?: string | null;
  currentTitle?: string | null;
};

export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean; redirectUrl: string; error?: string }> {
  try {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { userType, organizationId: orgSlugOrId, inviteToken, firstName, lastName } = data;
  const profileFields = {
    headline: data.headline || null,
    bio: data.bio || null,
    major: data.major || null,
    city: data.city || null,
    countryCode: data.countryCode?.toUpperCase().slice(0, 2) || null,
  };

  if (profileFields.countryCode) {
    const countryExists = await prisma.country.findUnique({
      where: { code: profileFields.countryCode },
    });
    if (!countryExists) {
      await prisma.country.create({
        data: {
          code: profileFields.countryCode,
          name: profileFields.countryCode,
          isActive: true,
        },
      });
    }
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { metadata: { path: ["clerkId"], equals: userId } },
  });
  if (!user) throw new Error("User record not found.");

  let org: any = null;
  let invite: any = null;

  // ── Invite flow: resolve org and role from the invite token ──
  if (inviteToken) {
    invite = await prisma.orgInvitation.findUnique({
      where: { token: inviteToken },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!invite || invite.status !== InviteStatus.pending || invite.expiresAt < new Date()) {
      throw new Error("Invitation is invalid or has expired.");
    }

    org = invite.organization;
  } else {
    // ── Free-flow: resolve org from slug or ID ──
    if (!orgSlugOrId) throw new Error("Organization is required.");
    org = await prisma.organization.findFirst({
      where: { OR: [{ id: orgSlugOrId }, { slug: orgSlugOrId }] },
    });
    if (!org) throw new Error("Organization not found.");
  }

  const orgId = org.id;
  const needsApproval = !inviteToken && (userType === UserType.student || !org.isVerified);

  // Update user record
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(firstName && { firstName }),
      ...(firstName && lastName && { fullName: `${firstName} ${lastName}` }),
      userType: inviteToken ? (invite.userType as UserType) : userType,
      status: needsApproval ? UserStatus.pending : UserStatus.active,
      organizationId: orgId,
    },
  });

  const effectiveUserType: UserType = inviteToken ? (invite.userType as UserType) : userType;

  // Profiles
  if (effectiveUserType === UserType.alumni) {
    const gy = data.graduationYear;
    const graduationYear = typeof gy === "string" ? parseInt(gy) : gy;
    await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      update: {
        graduationYear: graduationYear || null,
        ...profileFields,
        degree: data.degree || null,
        currentCompany: data.currentCompany || null,
        currentTitle: data.currentTitle || null,
      },
      create: {
        userId: user.id,
        organizationId: orgId,
        graduationYear: graduationYear || null,
        isVerified: !needsApproval,
        ...profileFields,
        degree: data.degree || null,
        currentCompany: data.currentCompany || null,
        currentTitle: data.currentTitle || null,
      },
    });
  } else if (effectiveUserType === UserType.student) {
    const eg = data.expectedGraduation ?? data.graduationYear;
    const expectedGraduation = typeof eg === "string" ? parseInt(eg) : eg;
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: { expectedGraduation: expectedGraduation || null, ...profileFields },
      create: {
        userId: user.id,
        organizationId: orgId,
        expectedGraduation: expectedGraduation || null,
        isVerified: false,
        ...profileFields,
      },
    });
  }

  // ── Invite flow: assign the role from the invite and mark as accepted ──
  if (inviteToken && invite?.roleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: user.id,
          roleId: invite.roleId,
          organizationId: orgId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: invite.roleId,
        organizationId: orgId,
        grantedBy: invite.invitedBy || "system",
        grantedReason: "Accepted organization invitation",
      },
    });

    // Mark invite as accepted
    await prisma.orgInvitation.update({
      where: { id: invite.id },
      data: { status: InviteStatus.accepted, acceptedAt: new Date() },
    });

    // Welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        type: "welcome",
        category: "system",
        title: `Welcome to ${org.name}!`,
        body: `You've successfully joined ${org.name} as a ${invite.role?.name || "Member"}.`,
        payload: { organizationId: orgId, role: invite.role?.name || "Member" },
        actionUrl: `/organization/${org.slug}/dashboard`,
      },
    });

    // Notify inviter
    if (invite.invitedBy) {
      await prisma.notification.create({
        data: {
          userId: invite.invitedBy,
          organizationId: orgId,
          type: "invitation_accepted",
          category: "social",
          title: "Invitation Accepted",
          body: `${user.fullName} has accepted your invitation to join ${org.name}.`,
          payload: { userId: user.id, userName: user.fullName, invitationId: invite.id },
          actionUrl: `/organization/${org.slug}/dashboard`,
        },
      });
    }
  } else if (!inviteToken) {
    // ── Free-flow: assign default role or create verification request ──
    if (needsApproval) {
      await prisma.verificationRequest.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          targetType: "join_request",
          status: "pending",
          notes: `${effectiveUserType} join request.`,
        },
      });
    } else {
      const roleSlug =
        effectiveUserType === UserType.alumni
          ? "alumni"
          : effectiveUserType === UserType.student
          ? "student"
          : "member";

      const defaultRole = await prisma.role.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            { isDefault: true, slug: roleSlug },
            { slug: roleSlug },
          ],
        },
        orderBy: { priority: "desc" },
      });

      if (defaultRole) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId_organizationId: {
              userId: user.id,
              roleId: defaultRole.id,
              organizationId: orgId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: defaultRole.id,
            organizationId: orgId,
            grantedBy: user.id,
          },
        });
      }
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      actorId: user.id,
      action: "onboarding.completed",
      entityType: "user",
      entityId: user.id,
      entityLabel: user.email,
      afterState: {
        userType: effectiveUserType,
        invitedFlow: !!inviteToken,
        organizationId: orgId,
      },
      severity: "info",
    },
  });

  // Clerk metadata
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      userType: effectiveUserType,
      organizationId: orgId,
      onboardingCompleted: true,
      status: needsApproval ? "pending" : "active",
    },
  });

  return { success: true, redirectUrl: `/organization/${org.slug}/dashboard` };
} catch (err: any) {
  return { success: false, error: err.message || "Failed to complete onboarding", redirectUrl: "" };
}
}