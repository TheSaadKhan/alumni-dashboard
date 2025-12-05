import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.events.findMany({
    where: { starts_at: { gte: new Date() } },
    orderBy: { starts_at: "asc" },
    take: 6,
  });

  return NextResponse.json({ events });
}
