// app/api/organizations/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================
 ✅ GET ORGANIZATIONS
 ✅ Supports:
    - /api/organizations        → all user orgs
    - /api/organizations?slug= → single org
========================= */

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    const profile = await prisma.profiles.findUnique({
      where: { auth_user_id: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // ✅ IF SLUG EXISTS → GET SINGLE ORG
    if (slug) {
      const membership = await prisma.organization_members.findFirst({
        where: {
          user_id: profile.id,
          organizations: { slug },
        },
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

      if (!membership) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        description: membership.organizations.description,
        logo_url: membership.organizations.logo_url,
        role: membership.organization_roles.name,
        roleDisplay: membership.organization_roles.display_name,
        permissions: membership.organization_roles.permissions,
      });
    }

    // ✅ NO SLUG → GET ALL USER ORGS
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

/* =========================
 ✅ POST ORGANIZATION
========================= */

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, website, logo_url, cover_image_url } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

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
