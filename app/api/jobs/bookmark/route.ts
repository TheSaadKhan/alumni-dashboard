// app/api/jobs/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ✅ TOGGLE JOB BOOKMARK */
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Check if already bookmarked
    const existing = await prisma.jobBookmark.findUnique({
      where: {
        jobPostingId_userId: {
          jobPostingId: jobId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await prisma.jobBookmark.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, bookmarked: false, message: "Bookmark removed" });
    } else {
      // Add bookmark
      await prisma.jobBookmark.create({
        data: {
          jobPostingId: jobId,
          userId: user.id,
          organizationId: user.organizationId!,
        },
      });
      return NextResponse.json({ success: true, bookmarked: true, message: "Job bookmarked" });
    }
  } catch (err: any) {
    console.error("Job bookmark failed:", err);
    return NextResponse.json({ error: "Failed to process bookmark" }, { status: 500 });
  }
}
