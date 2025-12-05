// app/actions/sendInviteAction.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type SendInvitePayload = {
  organizationId: string;
  invitedByMemberId: string;
  targetRoleId: string;
  email: string;
  customMessage?: string;
  expiresInDays?: number;
};

export async function sendInviteAction(payload: SendInvitePayload) {
  const {
    organizationId,
    invitedByMemberId,
    targetRoleId,
    email,
    customMessage,
    expiresInDays = 7,
  } = payload;

  if (!organizationId || !invitedByMemberId || !targetRoleId || !email) {
    throw new Error("Missing required invite fields");
  }

  // Create token and invitation (same logic as API)
  const token = require("crypto").randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invite = await prisma.organization_invitations.create({
    data: {
      organization_id: organizationId,
      invited_by_member_id: invitedByMemberId,
      target_role_id: targetRoleId,
      email: email.toLowerCase(),
      token,
      custom_message: customMessage ?? null,
      status: "pending",
      expires_at: expiresAt,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // TODO: Send invite email using your provider (SendGrid, Postmark, SES, etc.)
  // Example invite link:
  // const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${token}`
  // sendMail(email, subject, htmlBodyWithInviteLink)

  console.log("Invite created (server action):", invite.id, "token:", token);

  return { success: true, invite, token };
}
