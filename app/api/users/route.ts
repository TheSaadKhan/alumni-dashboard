// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const userType = searchParams.get("userType") || "";
    const skip = (page - 1) * limit;

    // Get user profile
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build where clause
    const where: any = {};

    if (organizationId) {
      // Get organization members
      const members = await prisma.organization_members.findMany({
        where: { organization_id: organizationId },
        select: { user_id: true },
      });

      const userIds = members.map((m) => m.user_id);
      where.id = { in: userIds };
    }

    if (status && status !== "all") {
      where.is_active = status === "active";
    }

    if (userType && userType !== "all") {
      where.user_type = userType;
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.profiles.findMany({
        where,
        include: {
          organization_members: organizationId
            ? {
                where: { organization_id: organizationId },
                include: {
                  organization_roles: {
                    select: {
                      id: true,
                      name: true,
                      display_name: true,
                    },
                  },
                },
              }
            : false,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.profiles.count({ where }),
    ]);

    // Format response
    const formattedUsers = users.map((user) => {
      const membership = user.organization_members?.[0];
      return {
        id: user.id,
        authUserId: user.auth_user_id,
        name: user.full_name || "Unknown",
        email: user.email,
        role: membership?.organization_roles?.name || user.user_type || "alumni",
        roleDisplay: membership?.organization_roles?.display_name || user.user_type || "Alumni",
        status: user.is_active ? "active" : "inactive",
        batch: user.graduation_year?.toString() || "",
        degree: user.degree || "",
        avatar: user.avatar_url,
        createdAt: user.created_at,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Users GET failed:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, organizationId, roleId, fullName } = body;

    if (!email || !organizationId || !roleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get inviter profile
    const inviterProfile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!inviterProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if user already exists
    let userProfile = await prisma.profiles.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userProfile) {
      // Create new profile
      userProfile = await prisma.profiles.create({
        data: {
          email: email.toLowerCase(),
          full_name: fullName || null,
          auth_user_id: null, // Will be set when user signs up
          is_active: true,
          user_type: "alumni",
          degree: "",
          metadata: {},
          skills: {},
        },
      });
    }

    // Check if already a member
    const existingMember = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: userProfile.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    // Add to organization
    const member = await prisma.organization_members.create({
      data: {
        organization_id: organizationId,
        user_id: userProfile.id,
        role_id: roleId,
        invited_by: inviterProfile.id,
        is_active: true,
        membership_status: "active",
      },
      include: {
        organization_roles: true,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.full_name,
          role: member.organization_roles.name,
        },
        success: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Users POST failed:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}