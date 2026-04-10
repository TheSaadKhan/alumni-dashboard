import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncClerkUser } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hdr = await headers();

  const svix_id = hdr.get("svix-id");
  const svix_timestamp = hdr.get("svix-timestamp");
  const svix_signature = hdr.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.log("No CLERK_WEBHOOK_SECRET found, simulating success logic.");
    return NextResponse.json({ success: true, simulated: true });
  }

  const wh = new Webhook(secret);

  let evt: any;
  try {
    evt = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type !== "user.created" && evt.type !== "user.updated") {
    return NextResponse.json({ status: "ignored" });
  }

  const data = evt.data;
  const clerkId = data.id;

  const email =
    data.email_addresses?.find(
      (e: any) => e.id === data.primary_email_address_id
    )?.email_address || data.email_addresses?.[0]?.email_address;

  if (!email) return new Response("Missing email", { status: 400 });

  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const avatarUrl = data.image_url || null;

  try {
      if (evt.type === "user.created") {
        await syncClerkUser({
            clerkId,
            email,
            firstName,
            lastName,
            imageUrl: avatarUrl
        });
      } else if (evt.type === "user.updated") {
         const existing = await prisma.user.findFirst({
             where: { metadata: { path: ["clerkId"], equals: clerkId } }
         });

         if (existing) {
             await prisma.user.update({
                 where: { id: existing.id },
                 data: {
                     email,
                     emailNormalized: email.toLowerCase(),
                     firstName,
                     fullName: `${firstName} ${lastName}`.trim(),
                     avatarUrl
                 }
             })
         }
      }

      return NextResponse.json({ success: true });

  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
