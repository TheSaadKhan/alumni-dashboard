// app/api/jobs/[jobId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await prisma.jobs.findUnique({
      where: { id: params.jobId },
      include: {
        organizations: true,
        job_applications: {
          include: {
            profiles: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("Job GET failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const job = await prisma.jobs.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify permissions
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: job.organization_id,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const role = membership.organization_roles;
    const canManageJobs =
      role.permissions?.manage_jobs ||
      role.permissions?.manage_org ||
      role.name === "super_admin" ||
      role.name === "admin";

    if (!canManageJobs) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const updated = await prisma.jobs.update({
      where: { id: params.jobId },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ job: updated, success: true });
  } catch (err: any) {
    console.error("Job PUT failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const job = await prisma.jobs.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify permissions
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: job.organization_id,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const role = membership.organization_roles;
    const canManageJobs =
      role.permissions?.manage_jobs ||
      role.permissions?.manage_org ||
      role.name === "super_admin" ||
      role.name === "admin";

    if (!canManageJobs) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.jobs.delete({
      where: { id: params.jobId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Job DELETE failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

