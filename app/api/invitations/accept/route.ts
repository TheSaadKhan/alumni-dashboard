import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    /* ✅ FIND INVITE */
    const invite = await prisma.organization_invitations.findUnique({
      where: { token },
      include: {
        organization_roles: true,
        organizations: true,
      },
    });

    if (!invite || invite.status !== "pending") {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    if (invite.expires_at < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    /* ✅ GET OR CREATE PROFILE */
    let profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          auth_user_id: clerkUser.id,
          email: clerkUser.emailAddresses[0].emailAddress,
          full_name: clerkUser.fullName || null,
          degree: "",
        },
      });
    }

    /* ✅ PREVENT DUPLICATE MEMBERSHIP */
    const existingMember = await prisma.organization_members.findFirst({
      where: {
        organization_id: invite.organization_id,
        user_id: profile.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 409 }
      );
    }

    /* ✅ CREATE ORG MEMBERSHIP */
    await prisma.organization_members.create({
      data: {
        organization_id: invite.organization_id,
        user_id: profile.id,
        role_id: invite.target_role_id,
        invited_by: invite.invited_by_member_id,
        is_active: true,
        membership_status: "active",
      },
    });

    /* ✅ MARK INVITE ACCEPTED */
    await prisma.organization_invitations.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    return NextResponse.json({
      success: true,
      organization: invite.organizations,
      role: invite.organization_roles,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
