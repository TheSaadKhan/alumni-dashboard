// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ GET ORGANIZATION SETTINGS */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    // Check if user is admin/super_admin for this org
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        userType: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.organizationId === organizationId && (user.userType === "admin" || user.userType === "super_admin");

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        displayName: true,
        description: true,
        settings: true,
        metadata: true,
        primaryColor: true,
        secondaryColor: true,
        website: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        siteName: organization.displayName || organization.name,
        siteDescription: organization.description || "",
        contactEmail: (organization.metadata as any)?.contactEmail || "",
        requireEmailVerification: (organization.settings as any)?.requireEmailVerification ?? true,
        allowRegistrations: (organization.settings as any)?.allowRegistrations ?? true,
        emailNotifications: (organization.settings as any)?.emailNotifications ?? true,
        adminAlerts: (organization.settings as any)?.adminAlerts ?? true,
        primaryColor: organization.primaryColor || "#3b82f6",
        secondaryColor: organization.secondaryColor || "#1e293b",
        website: organization.website || "",
      },
    });
  } catch (error: any) {
    console.error("Admin Settings GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch admin settings" }, { status: 500 });
  }
}

/* ✅ UPDATE ORGANIZATION SETTINGS */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, settings } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    // Check permissions
    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
    });

    if (!user || (user.userType !== "admin" && user.userType !== "super_admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        displayName: settings.siteName,
        description: settings.siteDescription,
        website: settings.website,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        settings: {
          requireEmailVerification: settings.requireEmailVerification,
          allowRegistrations: settings.allowRegistrations,
          emailNotifications: settings.emailNotifications,
          adminAlerts: settings.adminAlerts,
        },
        metadata: {
          contactEmail: settings.contactEmail,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization settings synchronized successfully",
    });
  } catch (error: any) {
    console.error("Admin Settings PUT failed:", error);
    return NextResponse.json({ error: "Failed to update admin settings" }, { status: 500 });
  }
}
