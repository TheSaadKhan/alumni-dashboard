// lib/mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  to: string,
  token: string,
  organizationName: string,
  inviterName?: string,
  roleName?: string,
  customMessage?: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/invite/accept?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Alumni Dashboard <onboarding@resend.dev>",
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to ${organizationName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">You're Invited!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${inviterName ? `Hi there,<br><br>${inviterName} has invited you to join <strong>${organizationName}</strong>` : `Hi there,<br><br>You've been invited to join <strong>${organizationName}</strong>`}
              ${roleName ? ` as a <strong>${roleName}</strong>.` : "."}
            </p>
            
            ${customMessage ? `<div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #666;">"${customMessage}"</p>
            </div>` : ""}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Failed to send invite email:", error);
    // Fallback: log the invite URL for development
    console.log(`[DEV] Invite URL for ${to}: ${inviteUrl}`);
    throw error;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Alumni Dashboard <onboarding@resend.dev>",
      to: [to],
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Verify Your Email</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there,<br><br>
              Please verify your email address to complete your registration.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    console.log(`[DEV] Verification URL for ${to}: ${verifyUrl}`);
    throw error;
  }
}
