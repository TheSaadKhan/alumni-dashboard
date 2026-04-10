// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate verification token
export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in profile metadata or create a verification table
    const profile = await prisma.user.findFirst({
      where: { metadata: { path: ["clerkId"], equals: clerkUser.id } },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Store verification token in metadata
    const metadata = (profile.metadata as any) || {};
    metadata.emailVerification = {
      token,
      expiresAt: expiresAt.toISOString(),
      verified: false,
    };

    await prisma.user.update({
      where: { id: profile.id },
      data: { metadata },
    });

    // Send verification email
    const { sendVerificationEmail } = await import("@/lib/mailer");
    await sendVerificationEmail(email, token);

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (err: any) {
    console.error("Verify email POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// Verify token
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Find profile with this verification token
    const profiles = await prisma.user.findMany({
      where: {
        metadata: {
          path: ["emailVerification", "token"],
          equals: token,
        },
      },
    });

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const profile = profiles[0];
    const metadata = (profile.metadata as any) || {};
    const verification = metadata.emailVerification || {};

    if (verification.verified) {
      return NextResponse.json({
        success: true,
        message: "Email already verified",
      });
    }

    if (new Date(verification.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Mark as verified
    metadata.emailVerification = {
      ...verification,
      verified: true,
      verifiedAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: { id: profile.id },
      data: { metadata },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err: any) {
    console.error("Verify email GET failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

