import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid is_active value" },
        { status: 400 }
      );
    }

    const updated = await prisma.profiles.update({
      where: { id: params.id },
      data: { is_active },
    });

    return NextResponse.json({ success: true, updated });
  } catch (e) {
    console.error("Update status error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
