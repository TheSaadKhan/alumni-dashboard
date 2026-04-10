// app/api/events/[eventId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, ConnectionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET SINGLE EVENT */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { eventId } = params;

    // Find the authenticated user
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
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch event with all related data
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        organizer: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            avatarUrl: true,
            email: true,
            userType: true,
          },
        },
        speakers: {
          select: {
            id: true,
            name: true,
            title: true,
            company: true,
            bio: true,
            avatarUrl: true,
            topic: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        registrations: {
          where: {
            status: { in: ["registered", "approved", "attended"] },
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                avatarUrl: true,
                userType: true,
                alumniProfile: {
                  select: {
                    graduationYear: true,
                    currentCompany: true,
                    currentTitle: true,
                  },
                },
                studentProfile: {
                  select: {
                    expectedGraduation: true,
                    major: true,
                  },
                },
              },
            },
          },
          orderBy: { registeredAt: "desc" },
          take: 50, // Limit attendees for performance
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
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has access to this event (must be in same organization)
    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrganizer = event.organizer.id === user.id;

    if (!isAdmin && !isSuperAdmin && !isOrganizer && event.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "You don't have access to this event" },
        { status: 403 }
      );
    }

    // Get user's registration status
    const userRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        registeredAt: true,
        checkedInAt: true,
        checkedInBy: true,
        answers: true,
        paymentStatus: true,
        paymentReference: true,
      },
    });

    // Calculate available spots
    const registeredCount = event._count.registrations;
    const availableSpots = event.maxCapacity 
      ? Math.max(0, event.maxCapacity - registeredCount)
      : null;
    const isFull = event.maxCapacity 
      ? registeredCount >= event.maxCapacity
      : false;

    // Check if registration is open
    const now = new Date();
    const isRegistrationOpen = 
      (!event.registrationOpensAt || now >= event.registrationOpensAt) &&
      (!event.registrationClosesAt || now <= event.registrationClosesAt) &&
      event.isPublished &&
      !event.cancelledAt &&
      now < event.startsAt;

    // Check if user can register
    const canRegister = !userRegistration && isRegistrationOpen && (!isFull || event.waitlistCount > 0);
    const canCancel = userRegistration && 
      userRegistration.status !== "cancelled" &&
      new Date(event.startsAt) > now;

    // Get connection status with organizer (if not self)
    let connectionStatus = null;
    if (event.organizer.id !== user.id) {
      const connection = await prisma.connection.findFirst({
        where: {
          organizationId: event.organizationId,
          OR: [
            { requesterId: user.id, recipientId: event.organizer.id },
            { requesterId: event.organizer.id, recipientId: user.id },
          ],
        },
        select: { status: true },
      });
      connectionStatus = connection?.status || null;
    }

    // Get similar events for recommendations
    const similarEvents = await prisma.event.findMany({
      where: {
        organizationId: event.organizationId,
        id: { not: eventId },
        deletedAt: null,
        cancelledAt: null,
        isPublished: true,
        startsAt: { gt: now },
        eventType: event.eventType,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        eventType: true,
        mode: true,
        startsAt: true,
        locationName: true,
        bannerUrl: true,
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
      orderBy: { startsAt: "asc" },
      take: 3,
    });

    // Format the response
    const response = {
      success: true,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        descriptionHtml: event.descriptionHtml,
        eventType: event.eventType,
        mode: event.mode,
        locationName: event.locationName,
        locationAddress: event.locationAddress,
        locationCity: event.locationCity,
        locationCountry: event.locationCountry,
        meetingLink: event.meetingLink,
        meetingPassword: event.meetingPassword,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
        maxCapacity: event.maxCapacity,
        registeredCount,
        waitlistCount: event.waitlistCount,
        availableSpots,
        isFull,
        isPaid: event.isPaid,
        price: event.price,
        currencyCode: event.currencyCode,
        bannerUrl: event.bannerUrl,
        thumbnailUrl: event.thumbnailUrl,
        isPublished: event.isPublished,
        isFeatured: event.isFeatured,
        requiresApproval: event.requiresApproval,
        registrationOpensAt: event.registrationOpensAt,
        registrationClosesAt: event.registrationClosesAt,
        cancelledAt: event.cancelledAt,
        cancellationReason: event.cancellationReason,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        viewCount: event.viewCount,
        extraData: event.extraData,
        
        // Relations
        organization: event.organization,
        organizer: event.organizer,
        speakers: event.speakers,
        
        // User-specific
        userRegistration,
        canRegister,
        canCancel,
        isRegistrationOpen,
        connectionStatus,
        
        // Attendees (limited for performance)
        attendees: event.registrations.map(reg => ({
          id: reg.user.id,
          name: reg.user.fullName,
          avatarUrl: reg.user.avatarUrl,
          userType: reg.user.userType,
          graduationYear: reg.user.alumniProfile?.graduationYear || reg.user.studentProfile?.expectedGraduation,
          company: reg.user.alumniProfile?.currentCompany,
          title: reg.user.alumniProfile?.currentTitle,
          major: reg.user.studentProfile?.major,
          checkedIn: !!reg.checkedInAt,
        })),
        
        // Recommendations
        similarEvents: similarEvents.map(se => ({
          id: se.id,
          title: se.title,
          slug: se.slug,
          eventType: se.eventType,
          mode: se.mode,
          startsAt: se.startsAt,
          locationName: se.locationName,
          bannerUrl: se.bannerUrl,
          registeredCount: se._count.registrations,
        })),
      },
    };

    // Increment view count asynchronously (don't await)
    prisma.event.update({
      where: { id: eventId },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error("Failed to increment view count:", err));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Fetch event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE EVENT */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { eventId } = params;

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: { id: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
        organizerId: true,
        title: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check permissions
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: existingEvent.organizationId,
        role: { slug: { in: ["admin", "super-admin"] } },
      },
    });
    const isAdmin = !!userRole;
    const isOrganizer = existingEvent.organizerId === user.id;
    const isSuperAdmin = user.userType === UserType.super_admin;

    if (!isOrganizer && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this event" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
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
      isPaid,
      price,
      currencyCode,
      bannerUrl,
      thumbnailUrl,
      isFeatured,
      requiresApproval,
      registrationOpensAt,
      registrationClosesAt,
      isPublished,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (mode !== undefined) updateData.mode = mode;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (locationAddress !== undefined) updateData.locationAddress = locationAddress;
    if (locationCity !== undefined) updateData.locationCity = locationCity;
    if (locationCountry !== undefined) updateData.locationCountry = locationCountry;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (meetingPassword !== undefined) updateData.meetingPassword = meetingPassword;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = new Date(endsAt);
    if (timezone !== undefined) updateData.timezone = timezone;
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity ? parseInt(maxCapacity) : null;
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (currencyCode !== undefined) updateData.currencyCode = currencyCode;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval;
    if (registrationOpensAt !== undefined) updateData.registrationOpensAt = registrationOpensAt ? new Date(registrationOpensAt) : null;
    if (registrationClosesAt !== undefined) updateData.registrationClosesAt = registrationClosesAt ? new Date(registrationClosesAt) : null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: error.message },
      { status: 500 }
    );
  }
}

/* ✅ DELETE/CANCEL EVENT */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { eventId } = params;
    const { searchParams } = new URL(request.url);
    const cancelReason = searchParams.get("reason") || "Event cancelled by organizer";

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: { id: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: existingEvent.organizationId,
        role: { slug: { in: ["admin", "super-admin"] } },
      },
    });
    const isAdmin = !!userRole;
    const isOrganizer = existingEvent.organizerId === user.id;
    const isSuperAdmin = user.userType === UserType.super_admin;

    if (!isOrganizer && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to cancel this event" },
        { status: 403 }
      );
    }

    // Soft delete the event
    const cancelledEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        cancelledAt: new Date(),
        cancellationReason: cancelReason,
        isPublished: false,
      },
    });

    // Notify all registered attendees
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
          actionUrl: "/dashboard/events",
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existingEvent.organizationId,
        actorId: user.id,
        action: "event.cancelled",
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
      event: cancelledEvent,
    });
  } catch (error: any) {
    console.error("Cancel event error:", error);
    return NextResponse.json(
      { error: "Failed to cancel event", details: error.message },
      { status: 500 }
    );
  }
}