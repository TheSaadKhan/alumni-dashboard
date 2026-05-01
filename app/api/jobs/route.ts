// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { JobType, ExperienceLevel, JobStatus, RemoteType, SalaryPeriod, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET ALL JOBS */
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
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || user.organizationId;
    const status = searchParams.get("status") || "active";
    const jobType = searchParams.get("jobType");
    const experienceLevel = searchParams.get("experienceLevel");
    const remoteType = searchParams.get("remoteType");
    const isRemote = searchParams.get("isRemote");
    const locationCity = searchParams.get("locationCity");
    const featured = searchParams.get("featured") === "true";
    const urgent = searchParams.get("urgent") === "true";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Check if user has access to this organization
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgMember = user.userRoles.some(ur => ur.organizationId === organizationId);
    
    if (!isSuperAdmin && !isOrgMember && user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Access denied to this organization" },
        { status: 403 }
      );
    }

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    // Status filter
    if (status && status !== "all") {
      where.status = status as JobStatus;
    }

    // Job type filter
    if (jobType && jobType !== "all") {
      where.jobType = jobType as JobType;
    }

    // Experience level filter
    if (experienceLevel && experienceLevel !== "all") {
      where.experienceLevel = experienceLevel as ExperienceLevel;
    }

    // Remote type filter
    if (remoteType && remoteType !== "all") {
      where.remoteType = remoteType as RemoteType;
    }

    // Remote filter
    if (isRemote === "true") {
      where.isRemote = true;
    } else if (isRemote === "false") {
      where.isRemote = false;
    }

    // Location filter
    if (locationCity) {
      where.locationCity = { contains: locationCity, mode: "insensitive" };
    }

    // Featured/Urgent filters
    if (featured) where.isFeatured = true;
    if (urgent) where.isUrgent = true;

    // Expiration filter (only show non-expired active jobs)
    if (status === "active") {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          companyName: true,
          companyLogoUrl: true,
          locationCity: true,
          locationCountry: true,
          isRemote: true,
          remoteType: true,
          jobType: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          salaryPeriod: true,
          isFeatured: true,
          isUrgent: true,
          status: true,
          applicationCount: true,
          viewCount: true,
          createdAt: true,
          expiresAt: true,
          organization: {
            select: { id: true, name: true, slug: true },
          },
          postedByUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { isUrgent: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Get user's applications for these jobs
    const userApplications = await prisma.jobApplication.findMany({
      where: {
        applicantId: user.id,
        jobPostingId: { in: jobs.map(j => j.id) },
      },
      select: {
        jobPostingId: true,
        status: true,
        createdAt: true,
      },
    });

    const userBookmarks = await prisma.jobBookmark.findMany({
      where: {
        userId: user.id,
        jobPostingId: { in: jobs.map(j => j.id) },
      },
      select: {
        jobPostingId: true,
      },
    });

    const applicationMap = new Map(
      userApplications.map(app => [app.jobPostingId, app])
    );

    const bookmarkSet = new Set(userBookmarks.map(b => b.jobPostingId));

    const enhancedJobs = jobs.map(job => ({
      ...job,
      userApplication: applicationMap.get(job.id) || null,
      hasApplied: applicationMap.has(job.id),
      isBookmarked: bookmarkSet.has(job.id),
      isExpiringSoon: job.expiresAt 
        ? new Date(job.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
        : false,
    }));

    // Get job statistics
    const stats = {
      total: total,
      active: await prisma.jobPosting.count({
        where: { organizationId, status: JobStatus.active, deletedAt: null },
      }),
      draft: await prisma.jobPosting.count({
        where: { organizationId, status: JobStatus.draft, deletedAt: null },
      }),
      filled: await prisma.jobPosting.count({
        where: { organizationId, status: JobStatus.filled, deletedAt: null },
      }),
      expired: await prisma.jobPosting.count({
        where: {
          organizationId,
          status: JobStatus.expired,
          deletedAt: null,
        },
      }),
    };

    return NextResponse.json({
      success: true,
      jobs: enhancedJobs,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Jobs GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: err.message },
      { status: 500 }
    );
  }
}

/* ✅ POST NEW JOB */
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
      select: {
        id: true,
        fullName: true,
        organizationId: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      organizationId,
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      companyName,
      companyLogoUrl,
      locationCity,
      locationCountry,
      isRemote = false,
      remoteType,
      jobType = "full_time",
      experienceLevel = "mid",
      educationLevel,
      salaryMin,
      salaryMax,
      salaryCurrency = "USD",
      salaryPeriod = "annual",
      showSalary = true,
      applicationMethod = "platform",
      applicationUrl,
      applicationEmail,
      customQuestions = [],
      isFeatured = false,
      isUrgent = false,
      expiresInDays = 30,
      status = "active",
    } = body;

    // Validation
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to post jobs
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isOrgMember = user.organizationId === organizationId;

    if (!isSuperAdmin && !isOrgAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: "You don't have permission to post jobs in this organization" },
        { status: 403 }
      );
    }

    // Check if organization exists and is active
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { isActive: true, planTier: true },
    });

    if (!organization || !organization.isActive) {
      return NextResponse.json(
        { error: "Organization is inactive or not found" },
        { status: 404 }
      );
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.jobPosting.findFirst({
        where: { organizationId, slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate expiration date
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Validate salary
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return NextResponse.json(
        { error: "Minimum salary cannot be greater than maximum salary" },
        { status: 400 }
      );
    }

    // Create job posting
    const job = await prisma.jobPosting.create({
      data: {
        organizationId,
        postedBy: user.id,
        title: title.trim(),
        slug,
        description: description.trim(),
        requirements: requirements || null,
        responsibilities: responsibilities || null,
        benefits: benefits || null,
        companyName: companyName || null,
        companyLogoUrl: companyLogoUrl || null,
        locationCity: locationCity || null,
        locationCountry: locationCountry || null,
        isRemote,
        remoteType: remoteType as RemoteType || null,
        jobType: jobType as JobType,
        experienceLevel: experienceLevel as ExperienceLevel,
        educationLevel: educationLevel as any || null,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        salaryCurrency: salaryCurrency,
        salaryPeriod: salaryPeriod as SalaryPeriod,
        showSalary,
        applicationMethod: applicationMethod as any,
        applicationUrl: applicationUrl || null,
        applicationEmail: applicationEmail || null,
        customQuestions: customQuestions,
        isFeatured,
        isUrgent,
        status: status as JobStatus,
        expiresAt,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: user.id,
        action: "job.created",
        entityType: "job_posting",
        entityId: job.id,
        entityLabel: job.title,
        afterState: {
          jobType: job.jobType,
          isRemote: job.isRemote,
          status: job.status,
        },
        severity: "info",
      },
    });

    // Notify organization admins about new job posting
    const admins = await prisma.userRole.findMany({
      where: {
        organizationId,
        role: {
          slug: { in: ["admin", "super-admin"] },
        },
        userId: { not: user.id },
      },
      select: { userId: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          organizationId,
          type: "job_posted",
          category: "jobs",
          title: "New Job Posted",
          body: `${user.fullName} posted a new job: ${job.title}`,
          payload: {
            jobId: job.id,
            jobTitle: job.title,
            postedBy: user.id,
          },
          actionUrl: `/dashboard/jobs/${job.slug}`,
        },
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        job: {
          id: job.id,
          title: job.title,
          slug: job.slug,
          status: job.status,
          createdAt: job.createdAt,
        },
        message: "Job posted successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Jobs POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create job posting" },
      { status: 500 }
    );
  }
}