// app/api/invitations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateToken(len = 24) {
  return randomBytes(len).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      organizationId,
      invitedByMemberId, // organization_members.id of the inviter
      targetRoleId, // organization_roles.id
      email,
      customMessage,
      expiresInDays = 7,
    } = body;

    if (!organizationId || !invitedByMemberId || !targetRoleId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // TODO: VERIFY inviter permissions:
    // - Check that invitedByMemberId belongs to organizationId
    // - Check that inviter's role allows inviting targetRoleId
    // Implement carefully with organization_members and organization_roles checks.

    // Create token
    const token = generateToken(16);
    const expiresAt = new Date(Date.now() + (Number(expiresInDays) * 24 * 60 * 60 * 1000));

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

    // TODO: Send email (use your mailer) to `email` with invite link:
    // e.g. `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept?token=${token}`
    // For now just return the token and invite row.
    console.log("Invite created:", invite.id, "token:", token);

    return NextResponse.json({ invite, token, success: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/invitations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
