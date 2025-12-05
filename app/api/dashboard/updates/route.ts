import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Simple activity feed: recent messages, connections, story likes
  const updates = await prisma.$queryRaw`
    SELECT id, full_name AS actor_name, 'joined' as type, created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 6
  `;

  // Map to consistent shape
  const mapped = (updates as any[]).map((u) => ({
    id: u.id,
    actor_name: u.actor_name ?? "Member",
    message: "joined the network",
    created_at: u.created_at,
  }));

  return NextResponse.json({ updates: mapped });
}
