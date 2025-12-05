import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  await prisma.organization_invitations.update({
    where: { token },
    data: { status: "rejected" },
  });

  return NextResponse.json({ success: true });
}
