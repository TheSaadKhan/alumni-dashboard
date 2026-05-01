// app/api/invites/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      roleId,
      email,
      userType,
      message,
      expiresInDays = 7,
    } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate expiresInDays
    if (expiresInDays < 1 || expiresInDays > 30) {
      return NextResponse.json(
        { error: "Expiration days must be between 1 and 30" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get inviter profile
    const inviterProfile = await prisma.user.findFirst({
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
        userType: true,
      },
    });

    if (!inviterProfile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Get inviter's role in the organization
    const inviterMember = await prisma.userRole.findFirst({
      where: {
        organizationId,
        userId: inviterProfile.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    });

    // Check if inviter is a member
    if (!inviterMember) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Check if organization exists and is active
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        planTier: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!organization.isActive) {
      return NextResponse.json(
        { error: "Organization is inactive. Cannot send invitations." },
        { status: 403 }
      );
    }

    // Get target role
    const targetRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDefault: true,
      },
    });

    if (!targetRole) {
      return NextResponse.json(
        { error: "Invalid role for this organization" },
        { status: 400 }
      );
    }

    // Define role hierarchy and permissions
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    const inviterRoleName = inviterMember.role.name.toLowerCase();
    const targetRoleName = targetRole.name.toLowerCase();

    // Check if inviter can invite this role
    const canInvite = roleHierarchy[inviterRoleName]?.includes(targetRoleName) || false;

    // Super admin can invite anyone
    const isSuperAdmin = inviterProfile.userType === UserType.super_admin;

    if (!canInvite && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: `You cannot invite users with the role "${targetRole.name}". You can only invite: ${roleHierarchy[inviterRoleName]?.join(", ") || "none"}`,
        },
        { status: 403 }
      );
    }

    // Determine user type from role if not provided
    let determinedUserType = userType;
    if (!determinedUserType) {
      if (targetRoleName === "student") {
        determinedUserType = "student";
      } else if (targetRoleName === "alumni") {
        determinedUserType = "alumni";
      } else {
        determinedUserType = "alumni"; // Default for admin/moderator roles
      }
    }

    // Validate user type
    if (!["alumni", "student"].includes(determinedUserType)) {
      return NextResponse.json(
        { error: "Invalid user type. Must be 'alumni' or 'student'" },
        { status: 400 }
      );
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        emailNormalized: normalizedEmail,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User already exists in this organization",
          userName: existingUser.fullName,
          userStatus: existingUser.status,
        },
        { status: 409 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await prisma.orgInvitation.findFirst({
      where: {
        organizationId,
        email: normalizedEmail,
        status: InviteStatus.pending,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        expiresAt: true,
        role: {
          select: { name: true },
        },
      },
    });

    let inviteToUpdateId: string | undefined;
    if (existingInvite) {
      inviteToUpdateId = existingInvite.id;
    }

    // Check organization capacity
    const memberCount = await prisma.userRole.count({
      where: {
        organizationId,
        revokedAt: null,
      },
    });

    const planLimits: Record<string, number> = {
      free: 100,
      starter: 500,
      pro: 2000,
      enterprise: 10000,
      custom: 100000,
    };

    const maxMembers = planLimits[organization.planTier] || 100;

    if (memberCount >= maxMembers) {
      return NextResponse.json(
        {
          error: "Organization has reached its member limit",
          currentMembers: memberCount,
          maxMembers,
          plan: organization.planTier,
        },
        { status: 403 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create or update invitation within transaction
    const invitation = await prisma.$transaction(async (tx) => {
      const includeData = {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      };

      let invite;

      if (inviteToUpdateId) {
        invite = await tx.orgInvitation.update({
          where: { id: inviteToUpdateId },
          data: {
            invitedBy: inviterProfile.id,
            roleId: targetRole.id,
            userType: determinedUserType as any,
            token,
            message: message || null,
            expiresAt,
          },
          include: includeData,
        });
      } else {
        invite = await tx.orgInvitation.create({
          data: {
            organizationId,
            invitedBy: inviterProfile.id,
            roleId: targetRole.id,
            userType: determinedUserType as any,
            email: normalizedEmail,
            token,
            message: message || null,
            status: InviteStatus.pending,
            expiresAt,
          },
          include: includeData,
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: inviterProfile.id,
          action: "invitation.created",
          entityType: "org_invitation",
          entityId: invite.id,
          entityLabel: normalizedEmail,
          afterState: {
            roleId: targetRole.id,
            roleName: targetRole.name,
            userType: determinedUserType,
            expiresAt,
            expiresInDays,
          },
          severity: "info",
        },
      });

      // Create notification for organization admins (optional)
      const admins = await tx.userRole.findMany({
        where: {
          organizationId,
          role: {
            slug: { in: ["admin", "super-admin"] },
          },
          userId: { not: inviterProfile.id },
        },
        select: { userId: true },
      });

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.userId,
            organizationId,
            type: "invitation_sent",
            category: "system",
            title: "New Invitation Sent",
            body: `${inviterProfile.fullName} invited ${normalizedEmail} to join as ${targetRole.name}`,
            payload: {
              invitationId: invite.id,
              invitedBy: inviterProfile.id,
              invitedEmail: normalizedEmail,
              role: targetRole.name,
            },
            actionUrl: `/dashboard/invites`,
          },
        });
      }

      return invite;
    });

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.alumniconnect.com";
    const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

    // Prepare email data
    const emailData = {
      to: normalizedEmail,
      inviterName: inviterProfile.fullName,
      inviterEmail: inviterProfile.email,
      organizationName: organization.name,
      organizationLogo: invitation.organization.logoUrl,
      roleName: targetRole.name,
      roleDescription: targetRole.description,
      customMessage: message,
      inviteUrl,
      expiresInDays,
      token,
    };

    let emailSent = false;
    let emailError: string | null = null;

    try {
      console.log("=== STARTING EMAIL DELIVERY ===");
      console.log(`SMTP_HOST: ${process.env.SMTP_HOST || "smtp.gmail.com"}`);
      console.log(`SMTP_PORT: ${process.env.SMTP_PORT || "587"}`);
      console.log(`SMTP_USER configured: ${!!process.env.SMTP_USER}`);
      console.log(`SMTP_PASS configured: ${!!process.env.SMTP_PASS}`);
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log("Verifying SMTP connection...");
      await transporter.verify();
      console.log("SMTP connection verified successfully!");

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Alumni Connect" <noreply@alumniconnect.com>',
        to: normalizedEmail,
        subject: `Invitation to join ${organization.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                .email-container {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  border: 1px solid #e2e8f0;
                }
                .header {
                  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                  padding: 40px 20px;
                  text-align: center;
                  color: white;
                }
                .content {
                  padding: 40px;
                  color: #1e293b;
                  line-height: 1.6;
                }
                .invite-badge {
                  display: inline-block;
                  padding: 6px 16px;
                  background-color: rgba(255,255,255,0.2);
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                  margin-bottom: 16px;
                  border: 1px solid rgba(255,255,255,0.3);
                }
                .h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 800;
                  letter-spacing: -0.025em;
                }
                .organization-box {
                  background-color: #f8fafc;
                  border-radius: 12px;
                  padding: 24px;
                  margin: 24px 0;
                  border: 1px solid #f1f5f9;
                  text-align: center;
                }
                .button-container {
                  text-align: center;
                  margin: 32px 0;
                }
                .button {
                  background-color: #4f46e5;
                  color: white !important;
                  padding: 16px 32px;
                  text-decoration: none;
                  border-radius: 12px;
                  font-weight: 700;
                  display: inline-block;
                  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                  transition: all 0.2s ease;
                }
                .footer {
                  background-color: #f1f5f9;
                  padding: 24px;
                  text-align: center;
                  font-size: 13px;
                  color: #64748b;
                }
                .message-quote {
                  border-left: 4px solid #4f46e5;
                  padding: 16px;
                  background-color: #f1f5f9;
                  margin: 24px 0;
                  font-style: italic;
                  color: #475569;
                  border-radius: 0 8px 8px 0;
                }
              </style>
            </head>
            <body style="background-color: #f4f7fa; padding: 20px; margin: 0;">
              <div class="email-container">
                <div class="header">
                  <div class="invite-badge">Exclusive Invitation</div>
                  <h1 class="h1">You've Been Invited</h1>
                </div>
                
                <div class="content">
                  <p style="font-size: 18px; margin-top: 0;">Hello,</p>
                  <p>
                    <strong>${inviterProfile.fullName}</strong> has personally invited you to join the elite community at 
                    <span style="color: #4f46e5; font-weight: 700;">${organization.name}</span>.
                  </p>
                  
                  <div class="organization-box">
                    <p style="margin: 0; color: #64748b; text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;">Your Designated Role</p>
                    <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #1e293b;">${targetRole.name}</p>
                  </div>

                  ${message ? `
                    <p style="margin-bottom: 8px; font-weight: 600; color: #475569;">A message for you:</p>
                    <div class="message-quote">"${message}"</div>
                  ` : ''}

                  <p>Join now to connect with alumni, access exclusive resources, and advance your career.</p>
                  
                  <div class="button-container">
                    <a href="${inviteUrl}" class="button">Accept Your Invitation</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #94a3b8; text-align: center;">
                    This invitation is valid for the next ${expiresInDays} days.
                  </p>
                </div>
                
                <div class="footer">
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} AlumniConnect. All rights reserved.</p>
                  <p style="margin: 8px 0 0 0;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                  <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    <p style="font-size: 11px; color: #94a3b8;">
                      Trouble with the button? Copy and paste this link:<br>
                      <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all;">${inviteUrl}</a>
                    </p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `
      };

      console.log(`Attempting to send email to ${normalizedEmail}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully! Message ID:", info.messageId);

      emailSent = true;
    } catch (error: any) {
      console.error("=== EMAIL DELIVERY FAILED ===");
      console.error("Error details:", error);
      emailError = error.message || String(error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Invitation created and sent successfully" 
        : `Invitation created but email delivery failed: ${emailError}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        role: invitation.role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          slug: invitation.organization.slug,
        },
      },
      emailSent,
      emailError: emailError ? "Email delivery failed" : undefined,
      // Only include inviteUrl in development
      ...(process.env.NODE_ENV === "development" && { inviteUrl }),
    });
  } catch (error: any) {
    console.error("Create invitation error:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An invitation with this token already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create invitation",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to get available roles for invitation (GET endpoint)
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

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
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's role in the organization
    const userRole = await prisma.userRole.findFirst({
      where: {
        organizationId,
        userId: user.id,
        revokedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!userRole && user.userType !== UserType.super_admin) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Define role hierarchy for invitation permissions
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ["admin", "moderator", "alumni", "student"],
      admin: ["moderator", "alumni", "student"],
      moderator: ["alumni", "student"],
      alumni: [],
      student: [],
    };

    const userRoleName = userRole?.role.name.toLowerCase() || "super_admin";
    const allowedRoleSlugs = roleHierarchy[userRoleName] || [];

    // Get available roles for invitation
    const availableRoles = await prisma.role.findMany({
      where: {
        organizationId,
        slug: { in: allowedRoleSlugs },
        isSystem: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDefault: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      roles: availableRoles,
      canInvite: allowedRoleSlugs.length > 0,
    });
  } catch (error: any) {
    console.error("Get available roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available roles" },
      { status: 500 }
    );
  }
}