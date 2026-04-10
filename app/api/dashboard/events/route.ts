// app/api/dashboard/events/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { $Enums, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const limit = parseInt(url.searchParams.get("limit") || "6");
    const includePast = url.searchParams.get("includePast") === "true";

    // Find user by Clerk ID
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use provided organizationId or fallback to user's organization
    const targetOrgId = organizationId || user.organizationId;

    if (!targetOrgId) {
      return NextResponse.json({ 
        error: "No organization associated with user" 
      }, { status: 400 });
    }

    // Check if user has access to this organization
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: targetOrgId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
      },
    });

    const isGlobalSuperAdmin = user.userType === UserType.super_admin;

    if (!isGlobalSuperAdmin && !userRole) {
      return NextResponse.json({ 
        error: "Access denied to this organization" 
      }, { status: 403 });
    }

    // Build where clause
    const whereClause: any = {
      organizationId: targetOrgId,
      deletedAt: null,
      isPublished: true,
    };

    if (!includePast) {
      whereClause.startsAt = { gte: new Date() };
    }

    // Fetch events with related data
    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        eventType: true,
        mode: true,
        locationName: true,
        locationCity: true,
        locationCountry: true,
        startsAt: true,
        endsAt: true,
        maxCapacity: true,
        registeredCount: true,
        waitlistCount: true,
        isPaid: true,
        price: true,
        currencyCode: true,
        bannerUrl: true,
        thumbnailUrl: true,
        isFeatured: true,
        createdAt: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ["registered", "approved", "attended"]
                }
              }
            }
          }
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { startsAt: "asc" }
      ],
      take: limit,
    });

    // Get user's registrations for these events
    const userRegistrations = await prisma.eventRegistration.findMany({
      where: {
        userId: user.id,
        eventId: {
          in: events.map(e => e.id),
        },
      },
      select: {
        eventId: true,
        status: true,
        registeredAt: true,
      },
    });

    // Create a map of user's registration status
    const registrationMap = new Map(
      userRegistrations.map(reg => [reg.eventId, reg])
    );

    // Enhance events with user registration status
    const enhancedEvents = events.map(event => ({
      ...event,
      userRegistration: registrationMap.get(event.id) || null,
      isRegistered: registrationMap.has(event.id),
      availableSpots: event.maxCapacity 
        ? Math.max(0, event.maxCapacity - (event.registeredCount || 0))
        : null,
      isFull: event.maxCapacity 
        ? (event.registeredCount || 0) >= event.maxCapacity
        : false,
    }));

    // Get upcoming events count for badge
    const upcomingEventsCount = await prisma.event.count({
      where: {
        organizationId: targetOrgId,
        deletedAt: null,
        cancelledAt: null,
        isPublished: true,
        startsAt: { gt: new Date() },
      },
    });

    // Get recent past events (if requested)
    let pastEvents: { id: string; slug: string; title: string; eventType: $Enums.EventType; registeredCount: number; startsAt: Date; endsAt: Date; }[] = [];
    if (includePast) {
      pastEvents = await prisma.event.findMany({
        where: {
          organizationId: targetOrgId,
          deletedAt: null,
          isPublished: true,
          endsAt: { lt: new Date() },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          eventType: true,
          startsAt: true,
          endsAt: true,
          registeredCount: true,
        },
        orderBy: {
          endsAt: "desc",
        },
        take: 3,
      });
    }

    return NextResponse.json({
      success: true,
      events: enhancedEvents,
      pastEvents,
      meta: {
        totalUpcoming: upcomingEventsCount,
        showing: enhancedEvents.length,
        organizationId: targetOrgId,
      },
    });
  } catch (error: any) {
    console.error("Dashboard events API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch events",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST: Register for an event
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, registrationAnswers } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizationId: true,
        maxCapacity: true,
        registeredCount: true,
        requiresApproval: true,
        isPublished: true,
        registrationOpensAt: true,
        registrationClosesAt: true,
        startsAt: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user belongs to the same organization
    if (event.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "You cannot register for events outside your organization" },
        { status: 403 }
      );
    }

    // Check if event is published
    if (!event.isPublished) {
      return NextResponse.json(
        { error: "Event is not available for registration" },
        { status: 400 }
      );
    }

    // Check registration dates
    const now = new Date();
    if (event.registrationOpensAt && now < event.registrationOpensAt) {
      return NextResponse.json(
        { error: "Registration has not opened yet" },
        { status: 400 }
      );
    }
    if (event.registrationClosesAt && now > event.registrationClosesAt) {
      return NextResponse.json(
        { error: "Registration has closed" },
        { status: 400 }
      );
    }

    // Check if event already started
    if (event.startsAt < now) {
      return NextResponse.json(
        { error: "Event has already started" },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 }
      );
    }

    // Check capacity
    let status = "registered";
    if (event.maxCapacity && (event.registeredCount || 0) >= event.maxCapacity) {
      status = "waitlisted";
    }

    // If approval required, set to pending approval
    if (event.requiresApproval) {
      status = "pending";
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: user.id,
        organizationId: event.organizationId,
        status: status as any,
        answers: registrationAnswers || {},
      },
    });

    // Update event registered count
    if (status === "registered") {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          registeredCount: {
            increment: 1,
          },
        },
      });
    } else if (status === "waitlisted") {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          waitlistCount: {
            increment: 1,
          },
        },
      });
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: event.organizationId,
        type: "event_registration",
        category: "events",
        title: status === "waitlisted" ? "Added to Waitlist" : "Registration Confirmed",
        body: status === "waitlisted" 
          ? `You've been added to the waitlist for ${event.title}`
          : `Your registration for ${event.title} has been confirmed`,
        payload: {
          eventId,
          status,
        },
        actionUrl: `/events/${eventId}`,
      },
    });

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        status: registration.status,
        isWaitlisted: status === "waitlisted",
        requiresApproval: event.requiresApproval && status === "pending",
      },
    });
  } catch (error: any) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { 
        error: "Failed to register for event",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: Cancel registration
export async function DELETE(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // Check if event already passed
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { startsAt: true },
    });

    if (event && event.startsAt < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel registration for past events" },
        { status: 400 }
      );
    }

    // Update registration status
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledReason: "User cancelled",
      },
    });

    // Update event counts
    if (registration.status === "registered") {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          registeredCount: {
            decrement: 1,
          },
        },
      });
    } else if (registration.status === "waitlisted") {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          waitlistCount: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error: any) {
    console.error("Event cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}