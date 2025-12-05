import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { organizationId, roleId, email, message } = body;

    if (!organizationId || !roleId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    /* ✅ GET INVITER PROFILE */
    const inviterProfile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!inviterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    /* ✅ GET INVITER MEMBER */
    const inviterMember = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: inviterProfile.id,
      },
      include: {
        organization_roles: true,
      },
    });

    if (!inviterMember) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    /* ✅ PREVENT DUPLICATE PENDING INVITES */
    const existing = await prisma.organization_invitations.findFirst({
      where: {
        organization_id: organizationId,
        email: normalizedEmail,
        status: "pending",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 409 }
      );
    }

    /* ✅ TOKEN + EXPIRY */
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    /* ✅ CREATE INVITE */
    const invite = await prisma.organization_invitations.create({
      data: {
        organization_id: organizationId,
        invited_by_member_id: inviterMember.id,
        target_role_id: roleId,
        email: normalizedEmail,
        token,
        expires_at: expiresAt,
        custom_message: message || null,
      },
      include: {
        organization_roles: true,
        organizations: true,
      },
    });

    /* ✅ ✅ SEND EMAIL */
    const emailResult = await sendInviteEmail(
      normalizedEmail,
      token,
      invite.organizations.name
    );

    return NextResponse.json({
      success: true,
      invite,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
