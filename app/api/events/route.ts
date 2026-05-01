// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { EventType, EventMode, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ALL EVENTS */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkId } },
      select: { id: true, organizationId: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || user.organizationId;
    const status = searchParams.get("status") || "published";
    const eventType = searchParams.get("eventType");
    const mode = searchParams.get("mode");
    const featured = searchParams.get("featured");
    const upcoming = searchParams.get("upcoming") === "true";
    const past = searchParams.get("past") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    // Status filter
    if (status === "published") {
      where.isPublished = true;
      where.cancelledAt = null;
    } else if (status === "draft") {
      where.isPublished = false;
    } else if (status === "cancelled") {
      where.cancelledAt = { not: null };
    }

    // Event type filter
    if (eventType && eventType !== "all") {
      where.eventType = eventType;
    }

    // Mode filter
    if (mode && mode !== "all") {
      where.mode = mode;
    }

    // Featured filter
    if (featured === "true") {
      where.isFeatured = true;
    }

    // Date filters
    const now = new Date();
    if (upcoming) {
      where.startsAt = { gt: now };
    } else if (past) {
      where.endsAt = { lt: now };
    }

    const [eventsList, total] = await Promise.all([
      prisma.event.findMany({
        where,
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
          meetingLink: true,
          startsAt: true,
          endsAt: true,
          maxCapacity: true,
          registeredCount: true,
          waitlistCount: true,
          isPublished: true,
          isFeatured: true,
          isPaid: true,
          price: true,
          currencyCode: true,
          bannerUrl: true,
          thumbnailUrl: true,
          createdAt: true,
          organizer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  status: { in: ["registered", "approved", "attended"] },
                },
              },
            },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { startsAt: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    // Get user's registrations for these events
    const userRegistrations = await prisma.eventRegistration.findMany({
      where: {
        userId: user.id,
        eventId: { in: eventsList.map(e => e.id) },
      },
      select: {
        eventId: true,
        status: true,
      },
    });

    const registrationMap = new Map(
      userRegistrations.map(reg => [reg.eventId, reg.status])
    );

    const enhancedEvents = eventsList.map(event => ({
      ...event,
      userRegistrationStatus: registrationMap.get(event.id) || null,
      isRegistered: registrationMap.has(event.id),
      availableSpots: event.maxCapacity 
        ? Math.max(0, event.maxCapacity - (event.registeredCount || 0))
        : null,
      isFull: event.maxCapacity 
        ? (event.registeredCount || 0) >= event.maxCapacity
        : false,
    }));

    return NextResponse.json({
      success: true,
      events: enhancedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Events GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch events", details: err.message },
      { status: 500 }
    );
  }
}

/* ✅ CREATE NEW EVENT */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkId } },
      select: { id: true, organizationId: true, userType: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    console.log("POST /api/events - Request Body:", JSON.stringify(body, null, 2));
    console.log("POST /api/events - Clerk ID:", clerkId);

    const {
      organizationId,
      title,
      description,
      eventType,
      mode,
      locationName,
      locationAddress,
      locationCity,
      locationCountry,
      meetingLink,
      meetingPassword,
      startsAt,
      endsAt,
      timezone,
      maxCapacity,
      isPaid = false,
      price,
      currencyCode = "USD",
      bannerUrl,
      thumbnailUrl,
      isFeatured = false,
      requiresApproval = false,
      registrationOpensAt,
      registrationClosesAt,
      isPublished = true,
    } = body;

    // Validation
    if (!organizationId) {
      console.log("Validation failed: Organization ID required");
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    if (!title || !title.trim()) {
      console.log("Validation failed: Event title required");
      return NextResponse.json({ error: "Event title required" }, { status: 400 });
    }

    const startDate = new Date(startsAt);
    if (isNaN(startDate.getTime())) {
      console.log("Validation failed: Invalid start date format", startsAt);
      return NextResponse.json({ error: "Invalid start date format" }, { status: 400 });
    }
    const endDate = endsAt ? new Date(endsAt) : new Date(startDate.getTime() + 3600000);
    if (endsAt && isNaN(endDate.getTime())) {
      console.log("Validation failed: Invalid end date format", endsAt);
      return NextResponse.json({ error: "Invalid end date format" }, { status: 400 });
    }

    if (endDate <= startDate) {
      console.log("Validation failed: End time must be after start time");
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Allow 5 minutes grace period for "past" events to account for clock skew/latency
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (startDate < fiveMinutesAgo) {
      const msg = `Event cannot be scheduled in the past (Start: ${startDate.toISOString()}, Server Time: ${new Date().toISOString()})`;
      console.log("Validation failed:", msg);
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    // Check if user belongs to organization
    const membership = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId,
        revokedAt: null,
      },
    });

    const isSuperAdmin = user.userType === UserType.super_admin;
    if (!membership && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have access to this organization" },
        { status: 403 }
      );
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.event.findFirst({
        where: { organizationId, slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Validate event type
    const validEventTypes = Object.values(EventType);
    const safeEventType = validEventTypes.includes(eventType as EventType)
      ? eventType
      : EventType.other;

    // Validate mode
    const validModes = Object.values(EventMode);
    const safeMode = validModes.includes(mode as EventMode)
      ? mode
      : EventMode.in_person;

    // Validate paid event
    if (isPaid && (!price || price <= 0)) {
      return NextResponse.json(
        { error: "Valid price required for paid events" },
        { status: 400 }
      );
    }

    // Verify currency exists to avoid FK violation
    let finalCurrency = null;
    if (currencyCode) {
      const currencyExists = await prisma.currency.findUnique({
        where: { code: currencyCode }
      });
      if (currencyExists) {
        finalCurrency = currencyCode;
      }
    }

    // Verify country exists to avoid FK violation
    let finalCountry = null;
    if (locationCountry) {
      const countryExists = await prisma.country.findUnique({
        where: { code: locationCountry }
      });
      if (countryExists) {
        finalCountry = locationCountry;
      }
    }

    // Verify timezone exists to avoid FK violation
    let finalTimezone = null;
    if (timezone) {
      const timezoneExists = await prisma.timezone.findUnique({
        where: { name: timezone }
      });
      if (timezoneExists) {
        finalTimezone = timezone;
      }
    }

    const event = await prisma.event.create({
      data: {
        organizationId,
        organizerId: user.id,
        slug,
        title: title.trim(),
        description: description || null,
        eventType: safeEventType,
        mode: safeMode,
        locationName: locationName || null,
        locationAddress: locationAddress || null,
        locationCity: locationCity || null,
        locationCountry: finalCountry,
        meetingLink: meetingLink || null,
        meetingPassword: meetingPassword || null,
        startsAt: startDate,
        endsAt: endDate,
        timezone: finalTimezone,
        maxCapacity: (maxCapacity !== null && maxCapacity !== undefined && maxCapacity !== "" && !isNaN(parseInt(maxCapacity))) ? parseInt(maxCapacity) : null,
        isPaid,
        price: isPaid ? (price ? parseFloat(price) : 0) : null,
        currencyCode: finalCurrency,
        bannerUrl: bannerUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        isFeatured,
        requiresApproval,
        registrationOpensAt: (registrationOpensAt && !isNaN(new Date(registrationOpensAt).getTime())) ? new Date(registrationOpensAt) : null,
        registrationClosesAt: (registrationClosesAt && !isNaN(new Date(registrationClosesAt).getTime())) ? new Date(registrationClosesAt) : null,
        isPublished,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: user.id,
        action: "event.created",
        entityType: "event",
        entityId: event.id,
        entityLabel: event.title,
        afterState: {
          eventType: event.eventType,
          mode: event.mode,
          startsAt: event.startsAt,
        },
        severity: "info",
      },
    });

    // Notify organization admins about new event
    const admins = await prisma.userRole.findMany({
      where: {
        organizationId,
        role: {
          slug: { in: ["admin", "super-admin"] },
        },
      },
      select: { userId: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          organizationId,
          type: "event_created",
          category: "events",
          title: "New Event Created",
          body: `${user.fullName} created "${event.title}"`,
          payload: { eventId: event.id },
          actionUrl: `/dashboard/events/${event.slug}`,
        },
      });
    }

    return NextResponse.json(
      { success: true, event },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Events POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create event", details: err.message },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE EVENT */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkId } },
      select: { id: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { eventId, ...updateData } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Get existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
        organizerId: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check permissions
    const isOrganizer = existingEvent.organizerId === user.id;
    const isSuperAdmin = user.userType === UserType.super_admin;
    
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: existingEvent.organizationId,
        role: { slug: { in: ["admin", "super-admin"] } },
      },
    });
    const isAdmin = !!userRole;

    if (!isOrganizer && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this event" },
        { status: 403 }
      );
    }

    // Prepare update payload
    const payload: any = {};

    if (updateData.title) payload.title = updateData.title;
    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.eventType) payload.eventType = updateData.eventType;
    if (updateData.mode) payload.mode = updateData.mode;
    if (updateData.locationName !== undefined) payload.locationName = updateData.locationName;
    if (updateData.locationAddress !== undefined) payload.locationAddress = updateData.locationAddress;
    if (updateData.locationCity !== undefined) payload.locationCity = updateData.locationCity;
    if (updateData.locationCountry !== undefined) payload.locationCountry = updateData.locationCountry;
    if (updateData.meetingLink !== undefined) payload.meetingLink = updateData.meetingLink;
    if (updateData.meetingPassword !== undefined) payload.meetingPassword = updateData.meetingPassword;
    if (updateData.startsAt) payload.startsAt = new Date(updateData.startsAt);
    if (updateData.endsAt) payload.endsAt = new Date(updateData.endsAt);
    if (updateData.timezone !== undefined) payload.timezone = updateData.timezone;
    if (updateData.maxCapacity !== undefined) payload.maxCapacity = updateData.maxCapacity ? parseInt(updateData.maxCapacity) : null;
    if (updateData.isPaid !== undefined) payload.isPaid = updateData.isPaid;
    if (updateData.price !== undefined) payload.price = updateData.price ? parseFloat(updateData.price) : null;
    if (updateData.currencyCode !== undefined) payload.currencyCode = updateData.currencyCode;
    if (updateData.bannerUrl !== undefined) payload.bannerUrl = updateData.bannerUrl;
    if (updateData.thumbnailUrl !== undefined) payload.thumbnailUrl = updateData.thumbnailUrl;
    if (updateData.isFeatured !== undefined) payload.isFeatured = updateData.isFeatured;
    if (updateData.requiresApproval !== undefined) payload.requiresApproval = updateData.requiresApproval;
    if (updateData.registrationOpensAt !== undefined) payload.registrationOpensAt = updateData.registrationOpensAt ? new Date(updateData.registrationOpensAt) : null;
    if (updateData.registrationClosesAt !== undefined) payload.registrationClosesAt = updateData.registrationClosesAt ? new Date(updateData.registrationClosesAt) : null;
    if (updateData.isPublished !== undefined) payload.isPublished = updateData.isPublished;

    // Verify currency exists to avoid FK violation
    if (payload.currencyCode) {
      const currencyExists = await prisma.currency.findUnique({
        where: { code: payload.currencyCode }
      });
      if (!currencyExists) {
        payload.currencyCode = null;
      }
    }

    // Verify country exists to avoid FK violation
    if (payload.locationCountry) {
      const countryExists = await prisma.country.findUnique({
        where: { code: payload.locationCountry }
      });
      if (!countryExists) {
        payload.locationCountry = null;
      }
    }

    // Verify timezone exists to avoid FK violation
    if (payload.timezone) {
      const timezoneExists = await prisma.timezone.findUnique({
        where: { name: payload.timezone }
      });
      if (!timezoneExists) {
        payload.timezone = null;
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: payload,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existingEvent.organizationId,
        actorId: user.id,
        action: "event.updated",
        entityType: "event",
        entityId: eventId,
        entityLabel: updatedEvent.title,
        afterState: { updatedFields: Object.keys(updateData) },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (err: any) {
    console.error("Events PUT failed:", err);
    return NextResponse.json(
      { error: "Failed to update event", details: err.message },
      { status: 500 }
    );
  }
}

/* ✅ DELETE / CANCEL EVENT */
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkId } },
      select: { id: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const cancelReason = searchParams.get("reason") || "Event cancelled by organizer";

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Get existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
        organizerId: true,
        title: true,
        isPublished: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check permissions
    const isOrganizer = existingEvent.organizerId === user.id;
    const isSuperAdmin = user.userType === UserType.super_admin;
    
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: existingEvent.organizationId,
        role: { slug: { in: ["admin", "super-admin"] } },
      },
    });
    const isAdmin = !!userRole;

    if (!isOrganizer && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Soft delete or mark as cancelled
    const deletedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        cancelledAt: new Date(),
        cancellationReason: cancelReason,
        isPublished: false,
      },
    });

    // Notify all registered attendees about cancellation
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: { in: ["registered", "approved", "attended"] },
      },
      select: { userId: true },
    });

    for (const reg of registrations) {
      await prisma.notification.create({
        data: {
          userId: reg.userId,
          organizationId: existingEvent.organizationId,
          type: "event_cancelled",
          category: "events",
          title: "Event Cancelled",
          body: `"${existingEvent.title}" has been cancelled. ${cancelReason}`,
          payload: { eventId },
          actionUrl: `/dashboard/events`,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existingEvent.organizationId,
        actorId: user.id,
        action: "event.deleted",
        entityType: "event",
        entityId: eventId,
        entityLabel: existingEvent.title,
        afterState: { cancelled: true, reason: cancelReason },
        severity: "warning",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event cancelled successfully",
      event: deletedEvent,
    });
  } catch (err: any) {
    console.error("Events DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to cancel event", details: err.message },
      { status: 500 }
    );
  }
}