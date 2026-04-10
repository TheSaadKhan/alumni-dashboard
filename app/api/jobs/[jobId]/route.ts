// app/api/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserType, JobStatus, ApplicationStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/* ✅ GET JOB DETAILS */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { jobId } = params;

    // Get current user
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
        email: true,
        organizationId: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
        alumniProfile: {
          select: {
            id: true,
            headline: true,
            currentCompany: true,
            currentTitle: true,
            graduationYear: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            headline: true,
            major: true,
            expectedGraduation: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch job with all relations
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId, deletedAt: null },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            website: true,
          },
        },
        postedByUser: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            avatarUrl: true,
            email: true,
            userType: true,
            alumniProfile: {
              select: {
                currentCompany: true,
                currentTitle: true,
                graduationYear: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        applications: {
          where: {
            OR: [
              { applicantId: user.id }, // User's own application
              // For admins, show all applications (handled separately)
            ],
          },
          include: {
            applicant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                userType: true,
                alumniProfile: {
                  select: {
                    graduationYear: true,
                    currentCompany: true,
                    currentTitle: true,
                  },
                },
                studentProfile: {
                  select: {
                    expectedGraduation: true,
                    major: true,
                  },
                },
              },
            },
            reviewer: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            applications: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has access to this job (must be in same organization)
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isJobPoster = job.postedByUser.id === user.id;
    const isOrgMember = user.organizationId === job.organizationId;

    if (!isSuperAdmin && !isOrgMember && !isOrgAdmin && !isJobPoster) {
      return NextResponse.json(
        { error: "You don't have access to this job" },
        { status: 403 }
      );
    }

    // Get user's application status (if any)
    const userApplication = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_applicantId: {
          jobPostingId: jobId,
          applicantId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        coverLetter: true,
        answers: true,
        createdAt: true,
        reviewedAt: true,
        reviewerNote: true,
      },
    });

    // Check if user has bookmarked this job
    const isBookmarked = await prisma.jobBookmark.findUnique({
      where: {
        jobPostingId_userId: {
          jobPostingId: jobId,
          userId: user.id,
        },
      },
    });

    // Get similar jobs (same category or similar title)
    const similarJobs = await prisma.jobPosting.findMany({
      where: {
        organizationId: job.organizationId,
        id: { not: jobId },
        status: JobStatus.active,
        deletedAt: null,
        OR: [
          { categoryId: job.categoryId },
          { jobType: job.jobType },
          { experienceLevel: job.experienceLevel },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        companyName: true,
        companyLogoUrl: true,
        locationCity: true,
        isRemote: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get application statistics (for admins and job posters)
    let applicationStats = null;
    if (isOrgAdmin || isJobPoster || isSuperAdmin) {
      const stats = await prisma.$transaction([
        prisma.jobApplication.count({
          where: { jobPostingId: jobId },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.submitted },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.reviewing },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.shortlisted },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.interview_scheduled },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.hired },
        }),
        prisma.jobApplication.count({
          where: { jobPostingId: jobId, status: ApplicationStatus.rejected },
        }),
      ]);

      applicationStats = {
        total: stats[0],
        submitted: stats[1],
        reviewing: stats[2],
        shortlisted: stats[3],
        interview: stats[4],
        hired: stats[5],
        rejected: stats[6],
      };
    }

    // Determine if user can apply
    const canApply = 
      !userApplication &&
      job.status === JobStatus.active &&
      (!job.expiresAt || new Date(job.expiresAt) > new Date()) &&
      user.organizationId === job.organizationId &&
      !isJobPoster;

    // Increment view count (async, don't await)
    prisma.jobPosting.update({
      where: { id: jobId },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error("Failed to increment view count:", err));

    // Prepare response
    const response: any = {
      success: true,
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        companyName: job.companyName,
        companyLogoUrl: job.companyLogoUrl,
        locationCity: job.locationCity,
        locationCountry: job.locationCountry,
        isRemote: job.isRemote,
        remoteType: job.remoteType,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        educationLevel: job.educationLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        salaryPeriod: job.salaryPeriod,
        showSalary: job.showSalary,
        applicationMethod: job.applicationMethod,
        applicationUrl: job.applicationUrl,
        applicationEmail: job.applicationEmail,
        customQuestions: job.customQuestions,
        isFeatured: job.isFeatured,
        isUrgent: job.isUrgent,
        status: job.status,
        applicationCount: job._count.applications,
        viewCount: job.viewCount,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
        organization: job.organization,
        postedBy: {
          id: job.postedByUser.id,
          name: job.postedByUser.fullName,
          avatar: job.postedByUser.avatarUrl,
          title: job.postedByUser.alumniProfile?.currentTitle,
          company: job.postedByUser.alumniProfile?.currentCompany,
        },
        category: job.category,
        userApplication,
        isBookmarked: !!isBookmarked,
        canApply,
        isExpiringSoon: job.expiresAt 
          ? new Date(job.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
          : false,
      },
      similarJobs,
    };

    // Add application stats for authorized users
    if (applicationStats) {
      response.applicationStats = applicationStats;
    }

    // Add all applications for admins/job posters
    if ((isOrgAdmin || isJobPoster || isSuperAdmin) && job.applications.length > 0) {
      response.applications = job.applications.map(app => ({
        id: app.id,
        status: app.status,
        coverLetter: app.coverLetter,
        answers: app.answers,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt,
        reviewerNote: app.reviewerNote,
        applicant: {
          id: app.applicant.id,
          name: app.applicant.fullName,
          email: app.applicant.email,
          avatar: app.applicant.avatarUrl,
          userType: app.applicant.userType,
          graduationYear: app.applicant.alumniProfile?.graduationYear || app.applicant.studentProfile?.expectedGraduation,
          currentCompany: app.applicant.alumniProfile?.currentCompany,
          currentTitle: app.applicant.alumniProfile?.currentTitle,
          major: app.applicant.studentProfile?.major,
        },
        reviewer: app.reviewer,
      }));
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Fetch job error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch job details",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE JOB */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { jobId } = params;

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
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        organizationId: true,
        postedBy: true,
        title: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isJobPoster = existingJob.postedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isJobPoster) {
      return NextResponse.json(
        { error: "You don't have permission to update this job" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Allowed fields to update
    const allowedFields = [
      "title", "description", "requirements", "responsibilities", "benefits",
      "companyName", "companyLogoUrl", "locationCity", "locationCountry",
      "isRemote", "remoteType", "jobType", "experienceLevel", "educationLevel",
      "salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod", "showSalary",
      "applicationMethod", "applicationUrl", "applicationEmail", "customQuestions",
      "isFeatured", "isUrgent", "status", "expiresAt"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "salaryMin" || field === "salaryMax") {
          updateData[field] = body[field] ? parseFloat(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existingJob.organizationId,
        actorId: user.id,
        action: "job.updated",
        entityType: "job_posting",
        entityId: jobId,
        entityLabel: existingJob.title,
        afterState: { updatedFields: Object.keys(updateData) },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Job updated successfully",
    });
  } catch (error: any) {
    console.error("Update job error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

/* ✅ DELETE JOB */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { jobId } = params;

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
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        organizationId: true,
        postedBy: true,
        title: true,
        status: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isJobPoster = existingJob.postedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isJobPoster) {
      return NextResponse.json(
        { error: "You don't have permission to delete this job" },
        { status: 403 }
      );
    }

    // Soft delete the job
    const deletedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        deletedAt: new Date(),
        status: JobStatus.closed,
      },
    });

    // Notify all applicants about job closure
    const applicants = await prisma.jobApplication.findMany({
      where: { jobPostingId: jobId },
      select: { applicantId: true },
    });

    for (const applicant of applicants) {
      await prisma.notification.create({
        data: {
          userId: applicant.applicantId,
          organizationId: existingJob.organizationId,
          type: "job_closed",
          category: "jobs",
          title: "Job Posting Closed",
          body: `The job "${existingJob.title}" has been closed.`,
          payload: { jobId },
          actionUrl: `/dashboard/jobs/${jobId}`,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existingJob.organizationId,
        actorId: user.id,
        action: "job.deleted",
        entityType: "job_posting",
        entityId: jobId,
        entityLabel: existingJob.title,
        afterState: { deleted: true, status: JobStatus.closed },
        severity: "warning",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete job error:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}