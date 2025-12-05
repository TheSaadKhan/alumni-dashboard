// /app/api/invitations/create/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    /* ---------------- AUTH ---------------- */
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ---------------- BODY ---------------- */
    const body = await req.json();
    const { organizationId, roleId, email, message } = body;

    if (!organizationId || !roleId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    /* ---------------- PROFILE ---------------- */
    const inviterProfile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!inviterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    /* ---------------- ORG MEMBERSHIP ---------------- */
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

    /* ---------------- ROLE PERMISSION ---------------- */
    const inviterRole = inviterMember.organization_roles;
    const allowedRoleNames =
      (inviterRole.can_invite_roles as string[]) || [];

    const targetRole = await prisma.organization_roles.findUnique({
      where: { id: roleId },
    });

    if (!targetRole || targetRole.organization_id !== organizationId) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!allowedRoleNames.includes(targetRole.name)) {
      return NextResponse.json(
        {
          error: `You do not have permission to invite ${targetRole.display_name || targetRole.name}`,
        },
        { status: 403 }
      );
    }

    /* ---------------- DUPLICATE INVITE ---------------- */
    const existingInvite = await prisma.organization_invitations.findFirst({
      where: {
        organization_id: organizationId,
        email: normalizedEmail,
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    /* ---------------- TOKEN ---------------- */
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    /* ---------------- SAVE INVITE ---------------- */
    const invitation = await prisma.organization_invitations.create({
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

    /* ---------------- EMAIL ---------------- */
    try {
      const organization = invitation.organizations;
      const role = invitation.organization_roles;

      const inviterName =
        inviterProfile.full_name || inviterProfile.email || "Admin";

      await sendInviteEmail(
        normalizedEmail,
        token,
        organization?.name || "Organization",
        inviterName,
        role?.display_name || role?.name,
        message || undefined
      );
    } catch (emailError) {
      console.error("❌ Invite email failed:", emailError);
      // ✅ Invitation still succeeds even if email fails
    }

    /* ---------------- SUCCESS ---------------- */
    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error) {
    console.error("❌ Invite server error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
