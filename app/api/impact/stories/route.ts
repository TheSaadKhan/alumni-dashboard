import { NextResponse } from "next/server";
import { getImpactStories } from "@/lib/impact";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const stories = await getImpactStories(organizationId);
    return NextResponse.json({ success: true, stories });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch stories" }, { status });
  }
}
