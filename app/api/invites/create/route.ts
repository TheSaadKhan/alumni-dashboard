// app/api/invites/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  organizationId: string;
  invitedByMemberId: string; // caller member id (must be validated server-side)
  targetRoleId: string;
  email: string;
  customMessage?: string;
  expiresInHours?: number; // optional TTL
};

function makeToken() {
  // use a safe random token
  return randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2, 8);
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.organizationId || !body.invitedByMemberId || !body.targetRoleId || !body.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = makeToken();
    const expiresAt = new Date(Date.now() + (body.expiresInHours ?? 72) * 60 * 60 * 1000);

    const invite = await prisma.organization_invitations.create({
      data: {
        organization_id: body.organizationId,
        invited_by_member_id: body.invitedByMemberId,
        target_role_id: body.targetRoleId,
        email: body.email.toLowerCase(),
        token,
        custom_message: body.customMessage ?? null,
        expires_at: expiresAt,
        metadata: {},
      },
    });

    // TODO: Send email with invite link including token (call your mailer)
    // Example invite URL: `${process.env.NEXT_PUBLIC_URL}/accept-invite?token=${token}`
    // sendInviteEmail(invite.email, invite.token, ...)

    return NextResponse.json({ success: true, invite: { id: invite.id, token: invite.token } });
  } catch (err) {
    console.error("Invite creation failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
