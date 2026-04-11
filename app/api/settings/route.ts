// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DigestFrequency } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ GET USER SETTINGS */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        metadata: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch notification preferences
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        privacy: (user.metadata as any).privacy || {
          profile_visible: true,
          email_visible: false,
          graduation_year_visible: true,
        },
        notifications: preferences.length > 0 ? preferences : [
          { notificationType: "email", inAppEnabled: true, emailEnabled: true, pushEnabled: true },
          { notificationType: "desktop", inAppEnabled: true, emailEnabled: false, pushEnabled: true },
          { notificationType: "activity", inAppEnabled: true, emailEnabled: true, pushEnabled: true },
        ],
      },
    });
  } catch (error: any) {
    console.error("Settings GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

/* ✅ UPDATE USER SETTINGS */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { privacy, notifications } = body;

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
        metadata: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update privacy in metadata
    if (privacy) {
      const currentMetadata = (user.metadata as any) || {};
      await prisma.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...currentMetadata,
            privacy: {
              ...(currentMetadata.privacy || {}),
              ...privacy,
            },
          },
        },
      });
    }

    // Update notification preferences
    if (notifications && Array.isArray(notifications)) {
      for (const pref of notifications) {
        await prisma.notificationPreference.upsert({
          where: {
            userId_organizationId_notificationType: {
              userId: user.id,
              organizationId: user.organizationId as string,
              notificationType: pref.notificationType,
            },
          },
          update: {
            inAppEnabled: pref.inAppEnabled ?? true,
            emailEnabled: pref.emailEnabled ?? true,
            pushEnabled: pref.pushEnabled ?? false,
          },
          create: {
            userId: user.id,
            organizationId: user.organizationId as string,
            notificationType: pref.notificationType,
            inAppEnabled: pref.inAppEnabled ?? true,
            emailEnabled: pref.emailEnabled ?? true,
            pushEnabled: pref.pushEnabled ?? false,
            digestFrequency: DigestFrequency.instant,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("Settings PUT failed:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
