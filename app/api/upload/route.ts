import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "Assets";
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Convert file to Buffer for Supabase upload
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
