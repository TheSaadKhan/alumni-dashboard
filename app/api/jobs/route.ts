// app/api/jobs/route.ts
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
    const type = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (organizationId) where.organization_id = organizationId;
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.employment_type = type;

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        include: {
          organizations: {
            select: { id: true, name: true, slug: true },
          },
          job_applications: {
            select: { id: true, user_id: true, status: true },
          },
          profiles: {
            select: { id: true, full_name: true, email: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where }),
    ]);

    return NextResponse.json(
      {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err) {
    console.error("Jobs GET failed:", err);
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
    const {
      organizationId,
      title,
      description,
      company_name,
      location,
      employment_type,
      salary_range,
      requirements,
      education_requirements,
      status = "open",
    } = body;

    if (!organizationId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title, and description are required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify permissions
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: organizationId,
        user_id: profile.id,
        is_active: true,
      },
      include: { organization_roles: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
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

    // Normalize salary_range to JSON if it's a string
    let salaryRangeJson: any = null;
    if (salary_range) {
      if (typeof salary_range === "string") {
        // Try to parse or create object
        try {
          salaryRangeJson = JSON.parse(salary_range);
        } catch {
          // If not JSON, create object from string
          salaryRangeJson = { display: salary_range };
        }
      } else {
        salaryRangeJson = salary_range;
      }
    }

    const job = await prisma.jobs.create({
      data: {
        organization_id: organizationId,
        poster_id: profile.id, // Required field
        created_by_member_id: membership.id, // Optional but useful
        title,
        description,
        company_name: company_name || "",
        location: location || "",
        employment_type: employment_type || "full-time",
        salary_range: salaryRangeJson,
        education_requirements: education_requirements || requirements || [],
        status,
      },
    });

    return NextResponse.json(
      { job, success: true },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("Jobs POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

