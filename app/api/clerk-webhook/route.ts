import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hdr = await headers();

  const svix_id = hdr.get("svix-id");
  const svix_timestamp = hdr.get("svix-timestamp");
  const svix_signature = hdr.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;
  try {
    evt = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type !== "user.created") {
    return NextResponse.json({ status: "ignored" });
  }

  const data = evt.data;

  const clerkId = data.id;

  const email =
    data.email_addresses?.find(
      (e: any) => e.id === data.primary_email_address_id
    )?.email_address || data.email_addresses?.[0]?.email_address;

  if (!email) return new Response("Missing email", { status: 400 });

  const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
  const avatar = data.image_url || null;

  /* ---------------------------------------------------
     1️⃣ IF NO ORGANIZATION EXISTS → CREATE FIRST ORG
     AND MAKE THE USER SUPER_ADMIN + MEMBER
  --------------------------------------------------- */

  const orgCount = await prisma.organizations.count();

  if (orgCount === 0) {
    console.log("🟪 First-ever user — creating organization + super_admin");

    // 1) Create profile
    const profile = await prisma.profiles.create({
      data: {
        auth_user_id: clerkId,
        email,
        full_name: fullName || null,
        avatar_url: avatar,
        user_type: "super_admin",
        is_active: true,
        degree: "",
        metadata: {},
        skills: {},
      },
    });

    const organization = await prisma.organizations.create({
      data: {
        name: "My First Organization",
        slug: "my-first-organization",
        website: null,
        logo_url: null,
        address: {},
        contact_email: null,
        phone_number: null,
        description: "Initial organization automatically created for system admin",
        organization_type: "educational",
        employee_count_range: null,
        metadata: {},
        is_active: true,
        is_verified: true,   // First org is always trusted
        created_by: clerkId, // Creator (super admin user)
      },
    });


    // 3) Create default SUPER ADMIN role in that org
    const superRole = await prisma.organization_roles.create({
      data: {
        organization_id: organization.id,
        name: "super_admin",
        display_name: "Super Admin",
        hierarchy_level: 100,
        permissions: ["all"],
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 4) Add user as member of that org with super_admin role
    await prisma.organization_members.create({
      data: {
        user_id: profile.id,
        organization_id: organization.id,
        role_id: superRole.id,
        membership_status: "active",
        is_active: true,
        is_verified: true,
        metadata: {},
      },
    });

    return NextResponse.json({
      success: true,
      role: "super_admin",
      organization_id: organization.id,
    });
  }

  /* ---------------------------------------------------
     2️⃣ IF ORGANIZATION ALREADY EXISTS → USER MUST HAVE INVITE
  --------------------------------------------------- */

  const invitation = await prisma.organization_invitations.findFirst({
    where: { email, status: "pending" },
  });

  if (!invitation) {
    console.log("❌ No invitation found — blocking user");
    return NextResponse.json(
      {
        error:
          "You must be invited by an administrator to join this organization.",
      },
      { status: 403 }
    );
  }

  console.log("📨 Invitation found → Accepting user");

  // Create or update the profile
  const profile = await prisma.profiles.upsert({
    where: { auth_user_id: clerkId },
    create: {
      auth_user_id: clerkId,
      email,
      full_name: fullName || null,
      avatar_url: avatar,
      user_type: "member",
      is_active: true,
      metadata: {},
      skills: {},
      degree: "",
    },
    update: {
      full_name: fullName || null,
      avatar_url: avatar,
      updated_at: new Date(),
    },
  });

  // Create membership
  await prisma.organization_members.create({
    data: {
      user_id: profile.id,
      organization_id: invitation.organization_id,
      role_id: invitation.target_role_id,
      invited_by: invitation.invited_by_member_id,
      membership_status: "active",
      is_active: true,
      is_verified: true,
      metadata: {},
    },
  });

  // Mark invitation accepted
  await prisma.organization_invitations.update({
    where: { id: invitation.id },
    data: { status: "accepted", updated_at: new Date() },
  });

  return NextResponse.json({
    success: true,
    role: "invited-role",
    organization_id: invitation.organization_id,
  });
}
