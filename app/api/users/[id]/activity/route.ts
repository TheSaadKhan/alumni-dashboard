import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const organizationId = req.nextUrl.searchParams.get("organizationId");

    const actor = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkId } },
      select: { id: true, userType: true, organizationId: true },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin =
      actor.userType === UserType.super_admin || actor.userType === UserType.admin;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = organizationId || actor.organizationId;
    if (!orgId) {
      return NextResponse.json({ activities: [] });
    }

    const activities = await prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        actorId: targetUserId,
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityLabel: true,
        severity: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        label: a.entityLabel,
        severity: a.severity,
        createdAt: a.createdAt,
        description: `${a.action.replace(/\./g, " ")} — ${a.entityLabel || a.entityType}`,
      })),
    });
  } catch (error: any) {
    console.error("User activity API error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
