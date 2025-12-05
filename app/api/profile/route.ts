// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateProfileAction } from "@/app/actions/updateProfileAction";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authUserId = url.searchParams.get("authUserId");
    if (!authUserId) {
      return NextResponse.json({ error: "Missing authUserId" }, { status: 400 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: authUserId },
    });

    return NextResponse.json(
      { profile },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("Profile GET failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { authUserId, ...profileData } = body;

    // Verify authUserId matches current user
    if (authUserId !== clerkUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Use the server action to update profile
    const updatedProfile = await updateProfileAction({
      authUserId,
      ...profileData,
    });

    return NextResponse.json(
      { profile: updatedProfile, success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("Profile POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
