// app/api/donations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ GET DONATIONS FOR CURRENT USER OR ORGANIZATION */
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
      select: { id: true, organizationId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "user"; // "user" or "organization"

    const where: any = {};
    if (scope === "organization" && user.organizationId) {
      where.organizationId = user.organizationId;
    } else {
      where.userId = user.id;
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { fullName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, donations });
  } catch (err: any) {
    console.error("Donations GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}

/* ✅ POST NEW DONATION (INITIALIZE) */
export async function POST(req: NextRequest) {
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
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "User or Organization not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, frequency, message, isAnonymous } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // In a real app, you would integrate with a payment gateway here (Stripe/Razorpay)
    // and get a transactionId. For now, we'll simulate a successful initialization.
    
    const donation = await prisma.donation.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        amount: parseFloat(amount),
        frequency: frequency || "one-time",
        message: message || null,
        isAnonymous: !!isAnonymous,
        status: "paid", // Simulating immediate success for this demo
        transactionId: `TXN_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        paymentMethod: "Card",
      },
    });

    return NextResponse.json({ 
      success: true, 
      donation,
      message: "Donation processed successfully (Simulated)" 
    });
  } catch (err: any) {
    console.error("Donations POST failed:", err);
    return NextResponse.json({ error: "Failed to process donation" }, { status: 500 });
  }
}