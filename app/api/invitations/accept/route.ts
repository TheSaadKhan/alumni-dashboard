// app/api/invitations/accept/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify user is authenticated
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = clerkUser.id;

    const invite = await prisma.organization_invitations.findUnique({
      where: { token },
      include: { organization_roles: true, organizations: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite already used or not pending" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await prisma.organization_invitations.update({
        where: { id: invite.id },
        data: { status: "expired", updated_at: new Date() },
      });
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // Find profile by auth_user_id
    let profile = await prisma.profiles.findUnique({
      where: { auth_user_id: authUserId },
    });

    // If not found, create a minimal profile (email unknown). You can prompt user to complete.
    if (!profile) {
      // Try to match by invite email (if invite.email)
      const byEmail =
        invite.email
          ? await prisma.profiles.findUnique({ where: { email: invite.email } })
          : null;

      if (byEmail) {
        profile = byEmail;
      } else {
        // Create skeleton profile. You may want to fill full_name via Clerk webhook earlier.
        profile = await prisma.profiles.create({
          data: {
            auth_user_id: authUserId,
            email: invite.email ?? "",
            full_name: null,
            avatar_url: null,
            is_active: true,
            user_type: "alumni",
            degree: "",
            metadata: {},
            skills: {},
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }

    // Create organization_members linking this profile (profile.id is UUID)
    // Choose role_id from invite.target_role_id
    const existingMember = await prisma.organization_members.findFirst({
      where: { organization_id: invite.organization_id, user_id: profile.id },
    });

    if (existingMember) {
      // mark invite accepted and return existing membership
      await prisma.organization_invitations.update({
        where: { id: invite.id },
        data: { status: "accepted", updated_at: new Date() },
      });

      return NextResponse.json({ success: true, member: existingMember });
    }

    // Insert new member
    const newMember = await prisma.organization_members.create({
      data: {
        organization_id: invite.organization_id,
        user_id: profile.id, // profile.id is the UUID used by organization_members.user_id
        role_id: invite.target_role_id,
        invited_by: invite.invited_by_member_id,
        is_active: true,
        membership_status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Mark invite accepted
    await prisma.organization_invitations.update({
      where: { id: invite.id },
      data: { status: "accepted", updated_at: new Date() },
    });

    // Check if profile needs completion (no degree means incomplete)
    const needsProfileCompletion = !profile.degree || profile.degree === "";

    return NextResponse.json({ 
      success: true, 
      member: newMember,
      needsProfileCompletion,
      profileId: profile.id
    });
  } catch (err) {
    console.error("POST /api/invitations/accept error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
