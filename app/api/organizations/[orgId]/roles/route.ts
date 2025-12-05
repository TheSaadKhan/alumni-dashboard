import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const roles = await prisma.organization_roles.findMany({
    where: { organization_id: params.id },
    orderBy: { hierarchy_level: "asc" },
  });

  return NextResponse.json({ roles });
}
