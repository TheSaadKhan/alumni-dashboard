import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Profile GET failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

