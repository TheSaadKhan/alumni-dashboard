// app/api/organizations/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get user's organizations
    const memberships = await prisma.organization_members.findMany({
      where: { user_id: profile.id },
      include: {
        organizations: true,
        organization_roles: {
          select: {
            id: true,
            name: true,
            display_name: true,
            hierarchy_level: true,
            permissions: true,
          },
        },
      },
    });

    const organizations = memberships.map((m) => ({
      id: m.organizations.id,
      name: m.organizations.name,
      slug: m.organizations.slug,
      description: m.organizations.description,
      logo_url: m.organizations.logo_url,
      role: m.organization_roles.name,
      roleDisplay: m.organization_roles.display_name,
      permissions: m.organization_roles.permissions,
    }));

    return NextResponse.json({ organizations });
  } catch (err: any) {
    console.error("Organizations GET failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, website, logo_url, cover_image_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Use the server action
    const { createOrganizationAction } = await import(
      "@/app/actions/createOrganization"
    );

    const result = await createOrganizationAction({
      name,
      description,
      website,
      logo_url,
      cover_image_url,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Organizations POST failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

