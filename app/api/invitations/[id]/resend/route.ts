import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/mailer";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invite = await prisma.organization_invitations.findUnique({
      where: { id: params.id },
      include: {
        organization_roles: true,
        organizations: true,
      },
    });

    if (!invite || invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    await sendInviteEmail(
      invite.email,
      invite.token,
      invite.organizations?.name || "Organization",
      "Administrator",
      invite.organization_roles?.display_name ||
        invite.organization_roles?.name
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
