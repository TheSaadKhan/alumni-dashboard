import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) return NextResponse.json({ invites: [] });

  const invites = await prisma.organization_invitations.findMany({
    where: { organization_id: organizationId },
    include: {
      organization_roles: true,
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ invites });
}
