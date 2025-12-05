import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membersCount, eventsCount, organizationsCount, activeConnections] = await Promise.all([
    prisma.profiles.count(),
    prisma.events.count({ where: { starts_at: { gte: new Date() } } }),
    prisma.organizations.count(),
    prisma.network_connections.count({ where: { status: "accepted" } }),
  ]);

  return NextResponse.json({
    membersCount,
    eventsCount,
    organizationsCount,
    activeConnections,
  });
}
