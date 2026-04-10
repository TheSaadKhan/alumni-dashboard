// app/actions/sendInviteAction.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import { randomBytes } from "crypto";

type SendInvitePayload = {
  organizationId?: string; // Made optional - will derive from user's context
  email: string;
  roleId?: string; // Optional - can be determined by userType
  userType: UserType; // Required - alumni or student
  customMessage?: string;
  expiresInDays?: number;
};

export async function sendInviteAction(payload: SendInvitePayload) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  const {
    organizationId: providedOrgId,
    email,
    roleId: providedRoleId,
    userType,
    customMessage,
    expiresInDays = 7,
  } = payload;

  // Find the authenticated user from our database
  const currentUser = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!currentUser) {
    throw new Error("User not found in system");
  }

  // Determine organization ID - either from payload or from user's current org
  const organizationId = providedOrgId || currentUser.organizationId;
  
  if (!organizationId) {
    throw new Error("Organization ID not specified and user has no associated organization");
  }

  // Check if user has permission to invite members
  const hasPermission = await canInviteMembers(currentUser, organizationId);
  if (!hasPermission) {
    throw new Error("You don't have permission to send invitations in this organization");
  }

  // Check if user already exists in the organization
  const existingUser = await prisma.user.findFirst({
    where: {
      emailNormalized: email.toLowerCase(),
      organizationId: organizationId,
    },
  });

  if (existingUser) {
    throw new Error("User already exists in this organization");
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.orgInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: organizationId,
      status: InviteStatus.pending,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvite) {
    throw new Error("A pending invitation already exists for this email");
  }

  // Determine role ID if not provided
  let roleId = providedRoleId;
  if (!roleId) {
    const defaultRole = await prisma.role.findFirst({
      where: {
        organizationId: organizationId,
        slug: userType.toLowerCase(),
        isDefault: true,
      },
    });

    if (!defaultRole) {
      throw new Error(`No default role found for user type: ${userType}`);
    }
    roleId = defaultRole.id;
  } else {
    // Verify the role belongs to the organization
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: organizationId,
      },
    });

    if (!role) {
      throw new Error("Role not found in this organization");
    }
  }

  // Generate invitation token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Create the invitation
  const invite = await prisma.orgInvitation.create({
    data: {
      organizationId,
      invitedBy: currentUser.id,
      roleId,
      userType,
      email: email.toLowerCase(),
      token,
      message: customMessage || null,
      status: InviteStatus.pending,
      expiresAt,
    },
    include: {
      role: {
        select: {
          name: true,
          slug: true,
        },
      },
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  // TODO: Send invite email using your provider (SendGrid, Postmark, SES, etc.)
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${token}`;
  const organizationName = invite.organization.name;
  
  // Example email sending (implement with your email provider)
  // await sendEmail({
  //   to: email,
  //   subject: `Invitation to join ${organizationName}`,
  //   html: `
  //     <h1>You've been invited to join ${organizationName}</h1>
  //     <p>${customMessage || `You've been invited as a ${userType}.`}</p>
  //     <a href="${inviteUrl}">Accept Invitation</a>
  //     <p>This invitation expires in ${expiresInDays} days.</p>
  //   `,
  // });

  console.log("Invite created:", {
    inviteId: invite.id,
    email: invite.email,
    token: token.substring(0, 8) + "...",
    expiresAt,
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorId: currentUser.id,
      action: "invitation.created",
      entityType: "org_invitation",
      entityId: invite.id,
      entityLabel: email,
      afterState: {
        userType,
        roleId,
        expiresAt,
      },
      severity: "info",
    },
  });

  return {
    success: true,
    invite: {
      id: invite.id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
      role: invite.role,
      organization: {
        name: invite.organization.name,
        slug: invite.organization.slug,
      },
    },
    inviteUrl, // Return for testing/development
  };
}

/* -------------------------------------------
   HELPER: Check if user can invite members
-------------------------------------------- */

async function canInviteMembers(user: any, organizationId: string): Promise<boolean> {
  // Super admin can invite anyone
  if (user.userType === "super_admin") {
    return true;
  }

  // Check user's roles in the organization
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: user.id,
      organizationId: organizationId,
      revokedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: true,
    },
  });

  // Check if user has admin or super_admin role
  const hasAdminRole = userRoles.some(
    (ur) => ur.role.slug === "admin" || ur.role.slug === "super-admin"
  );

  return hasAdminRole;
}

/* -------------------------------------------
   ACCEPT INVITE ACTION
-------------------------------------------- */

export type AcceptInvitePayload = {
  token: string;
  acceptTerms?: boolean;
};

export async function acceptInviteAction(payload: AcceptInvitePayload) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  const { token, acceptTerms = true } = payload;

  if (!acceptTerms) {
    throw new Error("You must accept the terms to join");
  }

  // Find the invitation
  const invitation = await prisma.orgInvitation.findUnique({
    where: { token },
    include: {
      organization: true,
      role: true,
    },
  });

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  // Check if invitation is expired
  if (invitation.expiresAt < new Date()) {
    await prisma.orgInvitation.update({
      where: { id: invitation.id },
      data: { status: InviteStatus.expired },
    });
    throw new Error("Invitation has expired");
  }

  // Check if invitation is still pending
  if (invitation.status !== InviteStatus.pending) {
    throw new Error(`Invitation is already ${invitation.status}`);
  }

  // Find the user in our system
  const user = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
  });

  if (!user) {
    throw new Error("User not found. Please complete onboarding first.");
  }

  // Check if email matches
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Check if user already belongs to this organization
  if (user.organizationId === invitation.organizationId) {
    throw new Error("You are already a member of this organization");
  }

  // Update user with organization and role
  const result = await prisma.$transaction(async (tx) => {
    // Update user's organization
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: invitation.organizationId,
        userType: invitation.userType,
        status: "active",
      },
    });

    // Assign the role
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: invitation.roleId as string,
        organizationId: invitation.organizationId,
        grantedBy: invitation.invitedBy ?? user.id,
        grantedReason: "Accepted organization invitation",
      },
    });

    // Update invitation status
    await tx.orgInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InviteStatus.accepted,
        acceptedAt: new Date(),
      },
    });

    // Create profile based on user type
    if (invitation.userType === UserType.alumni) {
      await tx.alumniProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      });
    } else if (invitation.userType === UserType.student) {
      await tx.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        organizationId: invitation.organizationId,
        actorId: user.id,
        action: "invitation.accepted",
        entityType: "org_invitation",
        entityId: invitation.id,
        entityLabel: user.email,
        afterState: { status: "accepted" },
        severity: "info",
      },
    });

    return updatedUser;
  });

  return {
    success: true,
    organizationId: invitation.organizationId,
    organizationName: invitation.organization.name,
    userType: invitation.userType,
  };
}

/* -------------------------------------------
   RESEND INVITE ACTION
-------------------------------------------- */

export type ResendInvitePayload = {
  inviteId: string;
};

export async function resendInviteAction(payload: ResendInvitePayload) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  const { inviteId } = payload;

  // Find the invitation
  const invitation = await prisma.orgInvitation.findUnique({
    where: { id: inviteId },
    include: {
      organization: true,
      role: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Check if user has permission to resend
  const currentUser = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const hasPermission = await canInviteMembers(currentUser, invitation.organizationId);
  if (!hasPermission) {
    throw new Error("You don't have permission to resend invitations");
  }

  // Generate new token and update expiration
  const newToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const updatedInvite = await prisma.orgInvitation.update({
    where: { id: inviteId },
    data: {
      token: newToken,
      expiresAt,
      status: InviteStatus.pending,
    },
  });

  // TODO: Resend email with new token
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${newToken}`;

  return {
    success: true,
    invite: updatedInvite,
    inviteUrl,
  };
}

/* -------------------------------------------
   CANCEL INVITE ACTION
-------------------------------------------- */

export type CancelInvitePayload = {
  inviteId: string;
  reason?: string;
};

export async function cancelInviteAction(payload: CancelInvitePayload) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  const { inviteId, reason } = payload;

  // Find the invitation
  const invitation = await prisma.orgInvitation.findUnique({
    where: { id: inviteId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== InviteStatus.pending) {
    throw new Error(`Cannot cancel invitation with status: ${invitation.status}`);
  }

  // Check if user has permission to cancel
  const currentUser = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const hasPermission = await canInviteMembers(currentUser, invitation.organizationId);
  if (!hasPermission) {
    throw new Error("You don't have permission to cancel invitations");
  }

  // Cancel the invitation
  const cancelledInvite = await prisma.orgInvitation.update({
    where: { id: inviteId },
    data: {
      status: InviteStatus.revoked,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      organizationId: invitation.organizationId,
      actorId: currentUser.id,
      action: "invitation.cancelled",
      entityType: "org_invitation",
      entityId: inviteId,
      entityLabel: invitation.email,
      afterState: { status: "revoked", reason },
      severity: "info",
    },
  });

  return {
    success: true,
    invite: cancelledInvite,
  };
}

/* -------------------------------------------
   GET ORGANIZATION INVITES ACTION
-------------------------------------------- */

export async function getOrganizationInvitesAction(organizationId?: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      metadata: {
        path: ["clerkId"],
        equals: clerkId,
      },
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const targetOrgId = organizationId || currentUser.organizationId;
  
  if (!targetOrgId) {
    throw new Error("No organization specified");
  }

  // Check permission
  const hasPermission = await canInviteMembers(currentUser, targetOrgId);
  if (!hasPermission) {
    throw new Error("You don't have permission to view invitations");
  }

  const invites = await prisma.orgInvitation.findMany({
    where: {
      organizationId: targetOrgId,
    },
    include: {
      role: {
        select: {
          name: true,
          slug: true,
        },
      },
      invitedByUser: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    invites,
  };
}