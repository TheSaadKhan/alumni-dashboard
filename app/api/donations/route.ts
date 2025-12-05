// app/api/donations/route.ts
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

    const [donations, total] = await Promise.all([
      prisma.donations.findMany({
        where,
        include: {
          organizations: {
            select: { id: true, name: true, slug: true },
          },
          // Note: donations.donor_id is String, not a relation
          // We'll need to fetch profiles separately if needed
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.donations.count({ where }),
    ]);

    // Calculate totals
    const totalAmount = await prisma.donations.aggregate({
      where: {
        ...where,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      donations,
      totalAmount: totalAmount._sum.amount || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Donations GET failed:", err);
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
    const { organizationId, amount, provider_name, anonymous = false } = body;

    if (!organizationId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId and amount are required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get membership for donor_member_id
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: profile.id,
        is_active: true,
      },
    });

    const donation = await prisma.donations.create({
      data: {
        organization_id: organizationId,
        donor_id: profile.id, // String field
        donor_member_id: membership?.id || null, // Optional UUID
        amount: parseFloat(amount),
        provider_name: provider_name || null,
        is_anonymous: anonymous,
        status: "pending",
        currency: "USD",
      },
    });

    return NextResponse.json({ donation, success: true });
  } catch (err: any) {
    console.error("Donations POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

