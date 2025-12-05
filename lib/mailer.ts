// lib/mailer.ts
import nodemailer from "nodemailer";

/* ✅ SMTP CONFIG */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ✅ BASE URL */
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/* ✅ SEND INVITE EMAIL */
export async function sendInviteEmail(
  to: string,
  token: string,
  organizationName: string
) {
  const inviteUrl = `${getBaseUrl()}/invite/accept?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Invitation to join ${organizationName}`,
    text: `You have been invited to join ${organizationName}.

Click the link below to accept the invitation:

${inviteUrl}

This link expires in 7 days.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false };
  }
}

/* ✅ SEND VERIFICATION EMAIL */
export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${getBaseUrl()}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: "Verify your email",
    text: `Verify your email using this link:

${verifyUrl}

This link expires in 24 hours.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("❌ Verification email failed:", error);
    return { success: false };
  }
}
