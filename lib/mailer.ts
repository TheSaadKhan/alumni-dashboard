// lib/mailer.ts
import { Resend } from "resend";

/* ---------------------------------------------
 ✅ ENV VALIDATION
--------------------------------------------- */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = "AlumniConnect <onboarding@resend.dev>";

if (!RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY is missing. Emails will fail.");
}

const resend = new Resend(RESEND_API_KEY);

/* ---------------------------------------------
 ✅ BASE URL RESOLUTION
--------------------------------------------- */
function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://yourdomain.com"
      : "http://localhost:3000")
  );
}

/* ---------------------------------------------
 ✅ UNIFIED HTML WRAPPER
--------------------------------------------- */
function emailLayout(title: string, content: string) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f9fafb; padding:24px; color:#111827;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 20px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:28px; text-align:center;">
          <h1 style="margin:0; font-size:24px; color:white;">AlumniConnect</h1>
        </div>

        <div style="padding:28px;">
          ${content}
        </div>

        <div style="padding:20px; border-top:1px solid #e5e7eb; text-align:center; font-size:12px; color:#6b7280;">
          © ${new Date().getFullYear()} AlumniConnect. All rights reserved.
        </div>
      </div>
    </body>
  </html>
  `;
}

/* ---------------------------------------------
 ✅ SEND INVITE EMAIL
--------------------------------------------- */
export async function sendInviteEmail(
  to: string,
  token: string,
  organizationName: string,
  inviterName?: string,
  roleName?: string,
  customMessage?: string
) {
  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

  const html = emailLayout(
    `Invitation to ${organizationName}`,
    `
      <p style="font-size:16px; margin-bottom:18px;">
        ${
          inviterName
            ? `<strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>`
            : `You have been invited to join <strong>${organizationName}</strong>`
        }
        ${roleName ? ` as a <strong>${roleName}</strong>.` : "."}
      </p>

      ${
        customMessage
          ? `
        <div style="background:#f3f4f6; padding:16px; border-left:4px solid #6366f1; border-radius:6px; margin:20px 0;">
          <p style="margin:0; font-style:italic;">"${customMessage}"</p>
        </div>
      `
          : ""
      }

      <div style="text-align:center; margin:32px 0;">
        <a href="${inviteUrl}" style="background:#6366f1; color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600;">
          Accept Invitation
        </a>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        Or copy this link:<br>
        <a href="${inviteUrl}" style="color:#6366f1; word-break:break-all;">${inviteUrl}</a>
      </p>

      <p style="font-size:12px; color:#9ca3af; margin-top:24px;">
        This invitation will expire in 7 days. If you weren't expecting this, you can safely ignore this email.
      </p>
    `
  );

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: `You've been invited to ${organizationName}`,
      html,
    });

    if (error) {
      console.error("❌ Resend invite error:", error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ Failed to send invite email:", error);
    console.log(`[DEV] Invite URL for ${to}: ${inviteUrl}`);
    return { success: false };
  }
}

/* ---------------------------------------------
 ✅ SEND EMAIL VERIFICATION
--------------------------------------------- */
export async function sendVerificationEmail(to: string, token: string) {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  const html = emailLayout(
    "Verify your email",
    `
      <p style="font-size:16px; margin-bottom:18px;">
        Please verify your email address to complete your registration.
      </p>

      <div style="text-align:center; margin:32px 0;">
        <a href="${verifyUrl}" style="background:#6366f1; color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600;">
          Verify Email
        </a>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        Or copy this link:<br>
        <a href="${verifyUrl}" style="color:#6366f1; word-break:break-all;">${verifyUrl}</a>
      </p>

      <p style="font-size:12px; color:#9ca3af; margin-top:24px;">
        This link expires in 24 hours. If you didn’t request this, you can ignore the email.
      </p>
    `
  );

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: "Verify your email address",
      html,
    });

    if (error) {
      console.error("❌ Resend verification error:", error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    console.log(`[DEV] Verification URL for ${to}: ${verifyUrl}`);
    return { success: false };
  }
}
