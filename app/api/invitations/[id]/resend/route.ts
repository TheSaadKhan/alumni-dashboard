// app/api/invites/[id]/resend/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus, UserType } from "@/lib/generated/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the invitation ID from params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
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
        fullName: true,
        email: true,
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch invitation with all necessary relations
    const invite = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
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
            customDomain: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation can be resent
    if (invite.status !== InviteStatus.pending) {
      return NextResponse.json(
        { 
          error: `Cannot resend invitation with status: ${invite.status}`,
          currentStatus: invite.status,
        },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    const isExpired = new Date(invite.expiresAt) < new Date();
    if (isExpired) {
      return NextResponse.json(
        { error: "Cannot resend expired invitation. Please create a new invitation." },
        { status: 400 }
      );
    }

    // Check permission to resend
    const isSuperAdmin = user.userType === UserType.super_admin;
    const isOrgAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isInviter = invite.invitedBy === user.id;

    if (!isSuperAdmin && !isOrgAdmin && !isInviter) {
      return NextResponse.json(
        { error: "You don't have permission to resend this invitation" },
        { status: 403 }
      );
    }

    // Generate new token and update expiration
    const newToken = randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const updatedInvite = await prisma.orgInvitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: InviteStatus.pending,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "invitation.resend",
        entityType: "org_invitation",
        entityId: id,
        entityLabel: invite.email,
        afterState: {
          previousExpiresAt: invite.expiresAt,
          newExpiresAt: newExpiresAt,
          previousTokenLength: invite.token.length,
        },
        severity: "info",
      },
    });

    // Generate invite URL
    const baseUrl = invite.organization.customDomain 
      ? `https://${invite.organization.customDomain}`
      : process.env.NEXT_PUBLIC_BASE_URL || "https://app.alumniconnect.com";
    
    const inviteUrl = `${baseUrl}/invite/accept?token=${newToken}`;

    // Prepare email data
    const emailData = {
      to: invite.email,
      inviteeEmail: invite.email,
      inviterName: user.fullName,
      organizationName: invite.organization.name,
      organizationLogo: invite.organization.logoUrl,
      roleName: invite.role?.name || "Member",
      customMessage: invite.message,
      inviteUrl,
      expiresInDays: 7,
      isResend: true,
    };

    // Attempt to send email
    let emailSent = false;
    let emailError = null;

    try {
      // Use your email service (SendGrid, Resend, Postmark, etc.)
      // This is a placeholder - implement with your actual email service
      
      // Example with Resend:
      // await resend.emails.send({
      //   from: "noreply@alumniconnect.com",
      //   to: invite.email,
      //   subject: `Reminder: Invitation to join ${invite.organization.name}`,
      //   react: InvitationEmailTemplate(emailData),
      // });
      
      // Example with SendGrid:
      // await sgMail.send({
      //   to: invite.email,
      //   from: "noreply@alumniconnect.com",
      //   subject: `Reminder: Invitation to join ${invite.organization.name}`,
      //   html: generateInviteEmailHtml(emailData),
      // });
      
      // For now, log the email data
      console.log("Email would be sent to:", invite.email);
      console.log("Invite URL:", inviteUrl);
      console.log("Email data:", emailData);
      
      emailSent = true;
    } catch (error) {
      console.error("Failed to send email:", error);
      emailError = error;
      // Don't fail the request if email fails, but log it
    }

    // Create notification for the inviter (optional)
    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        type: "invitation_resend",
        category: "system",
        title: "Invitation Resent",
        body: `Your invitation to ${invite.email} has been resent.`,
        payload: {
          invitationId: id,
          email: invite.email,
        },
        actionUrl: `/dashboard/invites`,
      },
    });

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Invitation resent successfully" 
        : "Invitation resent but email delivery failed. Please check email settings.",
      invitation: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        status: updatedInvite.status,
        expiresAt: updatedInvite.expiresAt,
        role: invite.role,
      },
      inviteUrl, // For testing/development only - remove in production
      emailSent,
      emailError: emailError ? "Email delivery failed" : undefined,
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { 
        error: "Failed to resend invitation",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email (optional - can be moved to separate file)
function generateInviteEmailHtml(data: {
  inviterName: string;
  organizationName: string;
  roleName: string;
  customMessage: string | null;
  inviteUrl: string;
  expiresInDays: number;
  isResend?: boolean;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to join ${data.organizationName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e2e8f0; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
        .message-box { background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
        .expiry-note { font-size: 12px; color: #718096; text-align: center; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${data.organizationName}</h2>
        </div>
        <div class="content">
          <h3>You're invited to join ${data.organizationName}</h3>
          <p>Hello,</p>
          <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.roleName}</strong>.</p>
          
          ${data.customMessage ? `
            <div class="message-box">
              <strong>Personal message from ${data.inviterName}:</strong><br>
              "${data.customMessage}"
            </div>
          ` : ''}
          
          <p>Click the button below to accept your invitation and join the community:</p>
          
          <div style="text-align: center;">
            <a href="${data.inviteUrl}" class="button">${data.isResend ? 'Accept Invitation (Resent)' : 'Accept Invitation'}</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: #f1f5f9; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px;">
            ${data.inviteUrl}
          </p>
          
          <div class="expiry-note">
            ⏰ This invitation will expire in ${data.expiresInDays} days.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AlumniConnect. All rights reserved.</p>
          <p>You received this email because you were invited to join an organization on AlumniConnect.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}