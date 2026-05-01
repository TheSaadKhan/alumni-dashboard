// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    const body = await req.json();
    const { name, email, subject, message, userId } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
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

    // Create contact message record
    const contactMessage = await (prisma as any).contactMessage.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        userId: userId || null,
        userAgent: req.headers.get("user-agent") || null,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      },
    });

    // Send email notification to admin
    try {
      const transporter = (await import("nodemailer")).default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.SMTP_FROM, // Send to admin
        subject: `[Contact Form] ${subject || "New Message"}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">New Contact Message</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject || "N/A"}</p>
            <div style="background: #f4f7fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Submitted on ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send admin notification:", emailErr);
    }

    // Create audit log
    if (clerkId) {
      await prisma.auditLog.create({
        data: {
          actorId: clerkId,
          action: "contact.submitted",
          entityType: "contact_message",
          entityId: contactMessage.id,
          severity: "info",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Contact message sent successfully",
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}