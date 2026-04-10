// app/api/jobs/[jobId]/apply/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { JobStatus, ApplicationStatus, UserType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ APPLY FOR JOB */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const {
      coverLetter,
      answers = {},
      expectedSalary,
      salaryCurrency = "USD",
      availableFrom,
      resumeUrl,
      portfolioUrl,
    } = body;

    // Get user profile
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
        alumniProfile: {
          select: {
            id: true,
            resumeUrl: true,
            yearsOfExperience: true,
            currentCompany: true,
            currentTitle: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            expectedGraduation: true,
            major: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Get job details
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId, deletedAt: null },
      select: {
        id: true,
        title: true,
        organizationId: true,
        status: true,
        expiresAt: true,
        applicationMethod: true,
        customQuestions: true,
        postedBy: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user belongs to the same organization
    if (user.organizationId !== job.organizationId) {
      return NextResponse.json(
        { error: "You can only apply for jobs within your organization" },
        { status: 403 }
      );
    }

    // Check if user is the job poster (can't apply to own job)
    if (job.postedBy === user.id) {
      return NextResponse.json(
        { error: "You cannot apply for your own job posting" },
        { status: 400 }
      );
    }

    // Check if job is active and not expired
    if (job.status !== JobStatus.active) {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This job posting has expired" },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_applicantId: {
          jobPostingId: jobId,
          applicantId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { 
          error: "You have already applied for this job",
          applicationStatus: existingApplication.status,
          appliedAt: existingApplication.createdAt,
        },
        { status: 400 }
      );
    }

    // Validate custom questions if required
    if (job.customQuestions && Array.isArray(job.customQuestions) && job.customQuestions.length > 0) {
      const requiredQuestions = job.customQuestions.filter((q: any) => q.required);
      const missingQuestions = requiredQuestions.filter((q: any) => !answers[q.id]);
      
      if (missingQuestions.length > 0) {
        return NextResponse.json(
          { 
            error: "Please answer all required questions",
            missingQuestions: missingQuestions.map((q: any) => q.question),
          },
          { status: 400 }
        );
      }
    }

    // Prepare application data
    const applicationData: any = {
      jobPostingId: jobId,
      applicantId: user.id,
      organizationId: job.organizationId,
      status: ApplicationStatus.submitted,
      answers: answers,
    };

    // Add optional fields
    if (coverLetter) applicationData.coverLetter = coverLetter;
    if (expectedSalary) applicationData.expectedSalary = parseFloat(expectedSalary);
    if (salaryCurrency) applicationData.salaryCurrency = salaryCurrency;
    if (availableFrom) applicationData.availableFrom = new Date(availableFrom);
    
    // Use provided resume URL or fallback to profile resume
    if (resumeUrl) {
      applicationData.resumeUrl = resumeUrl;
    } else if (user.alumniProfile?.resumeUrl) {
      applicationData.resumeUrl = user.alumniProfile.resumeUrl;
    }
    
    if (portfolioUrl) applicationData.portfolioUrl = portfolioUrl;

    // Create application within transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.jobApplication.create({
        data: applicationData,
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              userType: true,
            },
          },
        },
      });

      // Update job application count
      await tx.jobPosting.update({
        where: { id: jobId },
        data: { applicationCount: { increment: 1 } },
      });

      // Create notification for job poster
      await tx.notification.create({
        data: {
          userId: job.postedBy,
          organizationId: job.organizationId,
          type: "job_application",
          category: "jobs",
          title: "New Job Application",
          body: `${user.fullName} applied for "${job.title}"`,
          payload: {
            jobId,
            jobTitle: job.title,
            applicantId: user.id,
            applicantName: user.fullName,
            applicationId: app.id,
          },
          actionUrl: `/dashboard/jobs/${jobId}/applications`,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: job.organizationId,
          actorId: user.id,
          action: "job.application_submitted",
          entityType: "job_application",
          entityId: app.id,
          entityLabel: job.title,
          afterState: {
            status: ApplicationStatus.submitted,
            hasCoverLetter: !!coverLetter,
          },
          severity: "info",
        },
      });

      return app;
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Job application error:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || "Failed to submit application",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ GET APPLICATION STATUS */
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

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await prisma.jobApplication.findUnique({
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
        createdAt: true,
        reviewedAt: true,
        reviewerNote: true,
        expectedSalary: true,
        salaryCurrency: true,
        availableFrom: true,
      },
    });

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        status: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasApplied: !!application,
      application: application ? {
        id: application.id,
        status: application.status,
        coverLetter: application.coverLetter,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
        reviewerNote: application.reviewerNote,
        expectedSalary: application.expectedSalary,
        salaryCurrency: application.salaryCurrency,
        availableFrom: application.availableFrom,
      } : null,
      job: job ? {
        title: job.title,
        isActive: job.status === JobStatus.active && (!job.expiresAt || new Date(job.expiresAt) > new Date()),
      } : null,
    });
  } catch (error: any) {
    console.error("Check application error:", error);
    return NextResponse.json(
      { error: "Failed to check application status" },
      { status: 500 }
    );
  }
}

/* ✅ WITHDRAW APPLICATION */
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
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "User withdrew application";

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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the application
    const application = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_applicantId: {
          jobPostingId: jobId,
          applicantId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        jobPosting: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            postedBy: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can be withdrawn
    if (application.status !== ApplicationStatus.submitted && 
        application.status !== ApplicationStatus.reviewing) {
      return NextResponse.json(
        { 
          error: `Cannot withdraw application with status: ${application.status}`,
          currentStatus: application.status,
        },
        { status: 400 }
      );
    }

    // Withdraw the application
    const withdrawnApplication = await prisma.jobApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.withdrawn,
        withdrawnAt: new Date(),
        withdrawnReason: reason,
      },
    });

    // Update job application count
    await prisma.jobPosting.update({
      where: { id: jobId },
      data: { applicationCount: { decrement: 1 } },
    });

    // Notify job poster about withdrawal
    await prisma.notification.create({
      data: {
        userId: application.jobPosting.postedBy,
        organizationId: application.jobPosting.organizationId,
        type: "job_application_withdrawn",
        category: "jobs",
        title: "Application Withdrawn",
        body: `${user.fullName} withdrew their application for "${application.jobPosting.title}"`,
        payload: {
          jobId,
          jobTitle: application.jobPosting.title,
          applicantId: user.id,
          applicantName: user.fullName,
          reason,
        },
        actionUrl: `/dashboard/jobs/${jobId}/applications`,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: application.jobPosting.organizationId,
        actorId: user.id,
        action: "job.application_withdrawn",
        entityType: "job_application",
        entityId: application.id,
        entityLabel: application.jobPosting.title,
        afterState: {
          status: ApplicationStatus.withdrawn,
          reason,
        },
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application withdrawn successfully",
      application: {
        id: withdrawnApplication.id,
        status: withdrawnApplication.status,
        withdrawnAt: withdrawnApplication.withdrawnAt,
      },
    });
  } catch (error: any) {
    console.error("Withdraw application error:", error);
    return NextResponse.json(
      { error: "Failed to withdraw application" },
      { status: 500 }
    );
  }
}