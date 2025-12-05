import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 401 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: userId },
    });

    if (!profile) {
      return NextResponse.json({
        hasProfile: false,
        isProfileComplete: false,
        userType: null,
        hasOrganization: false,
      });
    }

    const hasOrganization = await prisma.organization_members.findFirst({
      where: {
        user_id: profile.id,
        is_active: true,
      },
    });

    const metadata = (profile.metadata as any) || {};

    const isProfileComplete =
      Boolean(profile.degree?.trim()) && Boolean(metadata.major);

    return NextResponse.json({
      hasProfile: true,
      isProfileComplete,
      userType: profile.user_type, // ✅ THIS FIXES YOUR ADMIN ROUTING
      hasOrganization: Boolean(hasOrganization),
    });
  } catch (err) {
    console.error("profile-status error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
