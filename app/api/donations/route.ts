// Disabled due to missing Donation model in schema
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Donations API not implemented" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "Donations API not implemented" }, { status: 501 });
}