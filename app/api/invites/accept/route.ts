// app/api/invites/accept/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  token: string;
  authUserId: string; // Clerk ID of the currently authenticated user
  full_name?: string;
  avatar_url?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.token || !body.authUserId) {
      return NextResponse.json({ error: "Missing token or authUserId" }, { status: 400 });
    }

    // Fetch invite
    const invite = await prisma.organization_invitations.findUnique({
      where: { token: body.token },
      include: { organization_roles: true, organizations: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite is not pending" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // Ensure profile exists or create one with auth_user_id set
    let profile = await prisma.profiles.findUnique({
      where: { auth_user_id: body.authUserId },
    });

    if (!profile) {
      // Try to find by email (invite email) and then set auth_user_id if matched, otherwise create new
      const byEmail = await prisma.profiles.findUnique({
        where: { email: invite.email },
      });

      if (byEmail) {
        profile = await prisma.profiles.update({
          where: { id: byEmail.id },
          data: {
            auth_user_id: body.authUserId,
            full_name: body.full_name ?? byEmail.full_name,
            avatar_url: body.avatar_url ?? byEmail.avatar_url,
            updated_at: new Date(),
          },
        });
      } else {
        profile = await prisma.profiles.create({
          data: {
            auth_user_id: body.authUserId,
            email: invite.email,
            full_name: body.full_name ?? null,
            avatar_url: body.avatar_url ?? null,
            is_active: true,
            degree: "",
            metadata: {},
            skills: {},
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } else {
      // profile exists and is linked to this authUserId — optionally update name/avatar
      await prisma.profiles.update({
        where: { id: profile.id },
        data: {
          full_name: body.full_name ?? profile.full_name,
          avatar_url: body.avatar_url ?? profile.avatar_url,
          updated_at: new Date(),
        },
      });
    }

    // Create organization_members if not exists (unique org_id + user_id is enforced)
    const membershipExists = await prisma.organization_members.findFirst({
      where: {
        organization_id: invite.organization_id,
        user_id: profile.id,
      },
    });

    if (!membershipExists) {
      await prisma.organization_members.create({
        data: {
          organization_id: invite.organization_id,
          user_id: profile.id,
          role_id: invite.target_role_id,
          invited_by: invite.invited_by_member_id,
          is_active: true,
          membership_status: "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } else {
      // Optionally update role if different
      if (membershipExists.role_id !== invite.target_role_id) {
        await prisma.organization_members.update({
          where: { id: membershipExists.id },
          data: { role_id: invite.target_role_id, updated_at: new Date() },
        });
      }
    }

    // Mark invite accepted
    await prisma.organization_invitations.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        updated_at: new Date(),
        metadata: { accepted_by_auth_user_id: body.authUserId, accepted_at: new Date().toISOString() },
      },
    });

    return NextResponse.json({ success: true, organization: invite.organizations.slug });
  } catch (err) {
    console.error("Invite accept failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
