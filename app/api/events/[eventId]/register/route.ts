// app/api/events/[eventId]/register/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/* ✅ REGISTER FOR EVENT */
export async function POST(
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

    // Get user profile
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        organizationId: true,
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Parse request body for additional data
    const body = await request.json().catch(() => ({}));
    const { answers = {}, paymentMethod, paymentIntentId } = body;

    // Get event details with all necessary data
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        organizationId: true,
        organizerId: true,
        maxCapacity: true,
        registeredCount: true,
        waitlistCount: true,
        requiresApproval: true,
        isPublished: true,
        isPaid: true,
        price: true,
        currencyCode: true,
        registrationOpensAt: true,
        registrationClosesAt: true,
        startsAt: true,
        endsAt: true,
        cancelledAt: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event is cancelled
    if (event.cancelledAt) {
      return NextResponse.json(
        { error: "This event has been cancelled" },
        { status: 400 }
      );
    }

    // Check if event is published
    if (!event.isPublished) {
      return NextResponse.json(
        { error: "This event is not available for registration" },
        { status: 400 }
      );
    }

    // Check if user belongs to the same organization
    if (event.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "You can only register for events in your organization" },
        { status: 403 }
      );
    }

    // Check registration period
    const now = new Date();
    if (event.registrationOpensAt && now < event.registrationOpensAt) {
      return NextResponse.json(
        { 
          error: "Registration has not opened yet",
          opensAt: event.registrationOpensAt,
        },
        { status: 400 }
      );
    }

    if (event.registrationClosesAt && now > event.registrationClosesAt) {
      return NextResponse.json(
        { 
          error: "Registration has closed",
          closedAt: event.registrationClosesAt,
        },
        { status: 400 }
      );
    }

    // Check if event has already started
    if (now > event.startsAt) {
      return NextResponse.json(
        { error: "Cannot register for past events" },
        { status: 400 }
      );
    }

    // Check if already registered
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
        { 
          error: "Already registered",
          registration: {
            id: existingRegistration.id,
            status: existingRegistration.status,
          },
        },
        { status: 400 }
      );
    }

    // Check capacity and determine status
    let status = "registered";
    let isWaitlisted = false;

    if (event.maxCapacity && event.registeredCount >= event.maxCapacity) {
      status = "waitlisted";
      isWaitlisted = true;
    }

    // If approval is required, set to pending
    if (event.requiresApproval && status !== "waitlisted") {
      status = "pending";
    }

    // Check if payment is required
    let paymentStatus = null;
    if (event.isPaid && event.price && Number(event.price) > 0) {
      paymentStatus = "pending";
      
      // If payment intent is provided, verify it
      if (paymentIntentId) {
        // Here you would verify the payment with Stripe/PayPal
        // For now, we'll assume payment is pending
      }
    }

    // Create registration within transaction
    const registration = await prisma.$transaction(async (tx) => {
      // Create registration record
      const reg = await tx.eventRegistration.create({
        data: {
          eventId,
          userId: user.id,
          organizationId: event.organizationId,
          status: status as any,
          answers: answers,
          paymentStatus: paymentStatus as any,
          paymentReference: paymentIntentId || null,
        },
      });

      // Update event counts
      if (status === "registered") {
        await tx.event.update({
          where: { id: eventId },
          data: { registeredCount: { increment: 1 } },
        });
      } else if (status === "waitlisted") {
        await tx.event.update({
          where: { id: eventId },
          data: { waitlistCount: { increment: 1 } },
        });
      }

      return reg;
    });

    // Create notification for user
    let notificationTitle = "";
    let notificationBody = "";
    let notificationType = "";

    if (status === "waitlisted") {
      notificationTitle = "Added to Waitlist";
      notificationBody = `You've been added to the waitlist for "${event.title}". You'll be notified if a spot becomes available.`;
      notificationType = "event_waitlist";
    } else if (status === "pending") {
      notificationTitle = "Registration Pending Approval";
      notificationBody = `Your registration for "${event.title}" is pending approval. You'll receive a confirmation once approved.`;
      notificationType = "event_pending";
    } else {
      notificationTitle = "Registration Confirmed";
      notificationBody = `Your registration for "${event.title}" has been confirmed. We look forward to seeing you there!`;
      notificationType = "event_registered";
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: event.organizationId,
        type: notificationType,
        category: "events",
        title: notificationTitle,
        body: notificationBody,
        payload: {
          eventId,
          eventTitle: event.title,
          status,
          isWaitlisted,
        },
        actionUrl: `/dashboard/events/${eventId}`,
      },
    });

    // Notify event organizer about new registration
    if (status === "registered" || status === "pending") {
      await prisma.notification.create({
        data: {
          userId: event.organizerId, // This would need to be fetched
          organizationId: event.organizationId,
          type: "event_new_registration",
          category: "events",
          title: "New Event Registration",
          body: `${user.fullName} registered for "${event.title}"`,
          payload: {
            eventId,
            userId: user.id,
            userName: user.fullName,
          },
          actionUrl: `/dashboard/events/${eventId}/registrations`,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: event.organizationId,
        actorId: user.id,
        action: "event.registered",
        entityType: "event_registration",
        entityId: registration.id,
        entityLabel: event.title,
        afterState: {
          status,
          isWaitlisted,
          requiresPayment: !!paymentStatus,
        },
        severity: "info",
      },
    });

    // Prepare response message
    let message = "";
    if (status === "waitlisted") {
      message = "You have been added to the waitlist. You'll be notified if a spot becomes available.";
    } else if (status === "pending") {
      message = "Your registration has been submitted for approval. You'll receive a confirmation email once approved.";
    } else {
      message = "Successfully registered for the event!";
    }

    return NextResponse.json({
      success: true,
      message,
      registration: {
        id: registration.id,
        status: registration.status,
        isWaitlisted,
        requiresApproval: status === "pending",
        requiresPayment: !!paymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register for event" },
      { status: 500 }
    );
  }
}

/* ✅ CANCEL REGISTRATION */
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
    const cancellationReason = searchParams.get("reason") || "User cancelled";

    // Get user profile
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizationId: true,
        startsAt: true,
        registeredCount: true,
        waitlistCount: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is registered
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
        { error: "You are not registered for this event" },
        { status: 404 }
      );
    }

    // Check if event has already started
    const now = new Date();
    if (now > event.startsAt) {
      return NextResponse.json(
        { error: "Cannot cancel registration for past events" },
        { status: 400 }
      );
    }

    // Cancel registration within transaction
    await prisma.$transaction(async (tx) => {
      // Update registration status
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: "cancelled",
          cancelledAt: now,
          cancelledReason: cancellationReason,
        },
      });

      // Update event counts
      if (registration.status === "registered") {
        await tx.event.update({
          where: { id: eventId },
          data: { registeredCount: { decrement: 1 } },
        });
      } else if (registration.status === "waitlisted") {
        await tx.event.update({
          where: { id: eventId },
          data: { waitlistCount: { decrement: 1 } },
        });
      }

      // If there are people on the waitlist and a spot opened up, promote the next person
      if (registration.status === "registered" && event.waitlistCount > 0) {
        const nextWaitlisted = await tx.eventRegistration.findFirst({
          where: {
            eventId,
            status: "waitlisted",
          },
          orderBy: { registeredAt: "asc" },
          select: { id: true, userId: true },
        });

        if (nextWaitlisted) {
          await tx.eventRegistration.update({
            where: { id: nextWaitlisted.id },
            data: { status: "registered" },
          });

          await tx.event.update({
            where: { id: eventId },
            data: {
              registeredCount: { increment: 1 },
              waitlistCount: { decrement: 1 },
            },
          });

          // Notify user that they've been promoted from waitlist
          await tx.notification.create({
            data: {
              userId: nextWaitlisted.userId,
              organizationId: event.organizationId,
              type: "event_waitlist_promoted",
              category: "events",
              title: "You're off the waitlist!",
              body: `A spot has opened up for "${event.title}". Your registration has been confirmed!`,
              payload: { eventId },
              actionUrl: `/dashboard/events/${eventId}`,
            },
          });
        }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: event.organizationId,
        type: "event_cancelled_registration",
        category: "events",
        title: "Registration Cancelled",
        body: `Your registration for "${event.title}" has been cancelled.`,
        payload: { eventId },
        actionUrl: `/dashboard/events/${eventId}`,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: event.organizationId,
        actorId: user.id,
        action: "event.registration_cancelled",
        entityType: "event_registration",
        entityId: registration.id,
        entityLabel: event.title,
        afterState: { status: "cancelled", reason: cancellationReason },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error: any) {
    console.error("Event cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel registration" },
      { status: 500 }
    );
  }
}

/* ✅ CHECK REGISTRATION STATUS */
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

    // Get user profile
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get registration status
    const registration = await prisma.eventRegistration.findUnique({
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
        paymentStatus: true,
        answers: true,
      },
    });

    // Get event capacity info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        maxCapacity: true,
        registeredCount: true,
        waitlistCount: true,
        startsAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      isRegistered: !!registration,
      registration: registration ? {
        id: registration.id,
        status: registration.status,
        registeredAt: registration.registeredAt,
        checkedInAt: registration.checkedInAt,
        paymentStatus: registration.paymentStatus,
      } : null,
      eventCapacity: event ? {
        maxCapacity: event.maxCapacity,
        registeredCount: event.registeredCount,
        waitlistCount: event.waitlistCount,
        availableSpots: event.maxCapacity 
          ? Math.max(0, event.maxCapacity - event.registeredCount)
          : null,
        isFull: event.maxCapacity 
          ? event.registeredCount >= event.maxCapacity
          : false,
      } : null,
    });
  } catch (error: any) {
    console.error("Check registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check registration status" },
      { status: 500 }
    );
  }
}