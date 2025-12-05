import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ✅ GET USERS */
export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const search = searchParams.get("search") || "";

    if (!organizationId) {
      return NextResponse.json({ users: [] });
    }

    const members = await prisma.organization_members.findMany({
      where: { organization_id: organizationId },
      include: {
        organization_roles: true,
      },
    });

    const profiles = await prisma.profiles.findMany({
      where: {
        id: { in: members.map((m) => m.user_id) },
        OR: search
          ? [
              { full_name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
    });

    const users = profiles.map((profile) => {
      const member = members.find((m) => m.user_id === profile.id);

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        is_active: profile.is_active,
        role: member?.organization_roles?.name,
        roleDisplay: member?.organization_roles?.display_name,
      };
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("GET users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ✅ CREATE USER (ADMIN ADD) */
export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { email, fullName, organizationId, roleId } = body;

    if (!email || !organizationId || !roleId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const inviterProfile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!inviterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let profile = await prisma.profiles.findUnique({
      where: { email: email.toLowerCase() },
    });

    /* ✅ REQUIRED auth_user_id (TEMP VALUE) */
    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          email: email.toLowerCase(),
          full_name: fullName || null,
          auth_user_id: `pending_${email.toLowerCase()}`,
          is_active: true,
          user_type: "alumni",
          degree: "",
          metadata: {},
          skills: {},
        },
      });
    }

    await prisma.organization_members.create({
      data: {
        organization_id: organizationId,
        user_id: profile.id,
        role_id: roleId,
        invited_by: inviterProfile.id,
        is_active: true,
        membership_status: "active",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("POST users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
