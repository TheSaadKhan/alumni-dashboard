import { NextResponse } from "next/server";
import { getImpactStats } from "@/lib/impact";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const stats = await getImpactStats(organizationId);
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch impact stats" }, { status });
  }
}
