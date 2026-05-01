import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invite = await prisma.orgInvitation.findUnique({
      where: { token },
      select: {
        status: true,
        expiresAt: true,
        email: true,
        userType: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        role: {
          select: {
            name: true,
            slug: true,
          },
        },
        invitedByUser: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invitation link" }, { status: 404 });
    }

    if (invite.status === InviteStatus.accepted) {
      return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 400 });
    }

    if (invite.status === InviteStatus.revoked) {
      return NextResponse.json({ error: "This invitation has been revoked." }, { status: 400 });
    }

    if (invite.status === InviteStatus.expired || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invitation has expired. Please request a new one." }, { status: 400 });
    }

    return NextResponse.json({
      organizationId: invite.organization.id,
      organizationName: invite.organization.name,
      organizationSlug: invite.organization.slug,
      organizationLogo: invite.organization.logoUrl,
      roleName: invite.role?.name || "Member",
      roleSlug: invite.role?.slug || "member",
      userType: invite.userType,
      email: invite.email,
      inviterName: invite.invitedByUser?.fullName || "An admin",
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Invite preview error:", error);
    return NextResponse.json({ error: "Failed to fetch invitation details" }, { status: 500 });
  }
}
