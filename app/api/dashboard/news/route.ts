import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const news = await prisma.stories.findMany({
    where: { status: "published" },
    orderBy: { published_at: "desc" },
    take: 6,
    select: { id: true, title: true, excerpt: true, published_at: true },
  });

  return NextResponse.json({ news });
}
