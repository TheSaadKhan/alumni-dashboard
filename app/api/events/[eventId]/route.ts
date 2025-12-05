// app/api/events/[eventId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await prisma.events.findUnique({
      where: { id: params.eventId },
      include: {
        organizations: true,
        event_attendees: {
          include: {
            profiles: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error("Event GET failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const event = await prisma.events.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify permissions
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: event.organization_id,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized" },
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

    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.event_type !== undefined) updateData.event_type = body.event_type;
    if (body.starts_at !== undefined) updateData.starts_at = new Date(body.starts_at);
    if (body.ends_at !== undefined) updateData.ends_at = body.ends_at ? new Date(body.ends_at) : null;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.max_registrations !== undefined) updateData.max_registrations = body.max_registrations ? parseInt(body.max_registrations) : null;
    if (body.is_virtual !== undefined) updateData.is_virtual = body.is_virtual;
    if (body.registration_required !== undefined) updateData.registration_required = body.registration_required;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    
    updateData.updated_at = new Date();

    const updated = await prisma.events.update({
      where: { id: params.eventId },
      data: updateData,
    });

    return NextResponse.json({ event: updated, success: true });
  } catch (err: any) {
    console.error("Event PUT failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { eventId: string } }
) {
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

    const event = await prisma.events.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify permissions
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: event.organization_id,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized" },
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

    await prisma.events.delete({
      where: { id: params.eventId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Event DELETE failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

