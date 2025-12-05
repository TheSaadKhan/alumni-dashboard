// app/api/events/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (organizationId) where.organization_id = organizationId;
    if (status && status !== "all") where.status = status;

    const [events, total] = await Promise.all([
      prisma.events.findMany({
        where,
        include: {
          organizations: {
            select: { id: true, name: true, slug: true },
          },
          event_attendees: {
            select: { id: true, attendee_id: true, status: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.events.count({ where }),
    ]);

    return NextResponse.json(
      {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err) {
    console.error("Events GET failed:", err);
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
    const {
      organizationId,
      title,
      description,
      event_type,
      starts_at,
      ends_at,
      location,
      max_registrations,
      is_virtual = false,
      registration_required = false,
      status = "draft",
    } = body;

    if (!organizationId || !title || !starts_at) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title, and starts_at are required" },
        { status: 400 }
      );
    }

    // Get user profile
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify user is admin/super_admin of organization
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: profile.id,
        is_active: true,
      },
      include: {
        organization_roles: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    const role = membership.organization_roles;
    const canManageEvents =
      role.permissions?.manage_events ||
      role.permissions?.manage_org ||
      role.name === "super_admin" ||
      role.name === "admin";

    if (!canManageEvents) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const event = await prisma.events.create({
      data: {
        organization_id: organizationId,
        organizer_id: profile.id, // Required field
        created_by_member_id: membership.id, // Optional but useful
        title,
        description: description || "",
        event_type: event_type || "general",
        starts_at: new Date(starts_at),
        ends_at: ends_at ? new Date(ends_at) : null,
        location: location || "",
        max_registrations: max_registrations ? parseInt(max_registrations) : null,
        is_virtual,
        registration_required,
        status,
      },
    });

    return NextResponse.json(
      { event, success: true },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("Events POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

