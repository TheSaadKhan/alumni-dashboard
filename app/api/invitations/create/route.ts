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
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { organizationId, roleId, email, message } = body;

    if (!organizationId || !roleId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load inviter's profile
    const inviterProfile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!inviterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Load inviter org membership
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

    const inviterRole = inviterMember.organization_roles;
    const allowedRoles: string[] = inviterRole.can_invite_roles ?? [];

    // Get target role to check if it's allowed
    const targetRole = await prisma.organization_roles.findUnique({
      where: { id: roleId },
    });

    if (!targetRole || targetRole.organization_id !== organizationId) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if inviter can invite this role
    const allowedRoleNames = (inviterRole.can_invite_roles as string[]) || [];
    const roleName = targetRole.name;
    
    if (!allowedRoleNames.includes(roleName)) {
      return NextResponse.json(
        { error: `You do not have permission to invite ${targetRole.display_name || roleName} role` },
        { status: 403 }
      );
    }

    // Check if user already has a pending invite
    const existingInvite = await prisma.organization_invitations.findFirst({
      where: {
        organization_id: organizationId,
        email: email.toLowerCase(),
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    // Create token
    const token = crypto.randomBytes(32).toString("hex");

    // Expiry: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.organization_invitations.create({
      data: {
        organization_id: organizationId,
        invited_by_member_id: inviterMember.id,
        target_role_id: roleId,
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
        custom_message: message || null,
      },
      include: {
        organization_roles: true,
        organizations: true,
      }
    });

    // Send email with invite link
    try {
      const organization = await prisma.organizations.findUnique({
        where: { id: organizationId },
      });

      const role = invitation.organization_roles;
      const inviterName = inviterProfile.full_name || inviterProfile.email;

      await sendInviteEmail(
        email.toLowerCase(),
        token,
        organization?.name || "Organization",
        inviterName,
        role?.display_name || role?.name,
        message || undefined
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
