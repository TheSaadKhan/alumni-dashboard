import { NextResponse } from "next/server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // optional: verify user
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // fetch small summary
  const profile = await prisma.profiles.findUnique({
    where: { auth_user_id: clerkUser.id },
    select: { full_name: true },
  });

  return NextResponse.json({ profileName: profile?.full_name ?? null });
}
