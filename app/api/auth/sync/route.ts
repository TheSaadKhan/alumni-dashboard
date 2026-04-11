import { NextResponse } from "next/server";
import { syncClerkUser } from "@/lib/db/users";
import { UserStatus } from "@/lib/generated/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = await req.json();

    if (!clerkId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await syncClerkUser({
      clerkId,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      imageUrl: imageUrl || "",
    });

    const details = (user as any).alumniProfile || (user as any).studentProfile || null;

    // Sync to Clerk Public Metadata if missing or changed
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const meta = clerkUser.publicMetadata;
    
    // We consider onboarding completed if they have an organization assigned, or if already marked as active/pending
    const onboardingCompleted = !!user.organizationId || user.status === UserStatus.active || user.status === UserStatus.pending;

    if (meta.userType !== user.userType || meta.organizationId !== user.organizationId || meta.status !== user.status) {
       await client.users.updateUserMetadata(clerkId, {
         publicMetadata: {
           userType: user.userType,
           organizationId: user.organizationId,
           onboardingCompleted: onboardingCompleted,
           status: user.status
         }
       });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        organizationId: user.organizationId,
        status: user.status,
        onboardingCompleted: onboardingCompleted,
        metadata: user.metadata || {},
        // Flatten details
        bio: details?.bio || null,
        location: details?.city || null,
        degree: details?.degree || null,
        graduation_year: details?.graduationYear || details?.expectedGraduation || null,
        currentTitle: details?.currentTitle || null,
        currentCompany: details?.currentCompany || null,
        linkedinUrl: details?.linkedinUrl || null,
        githubUrl: details?.githubUrl || null,
        websiteUrl: details?.websiteUrl || null,
        profileCompleteness: details?.profileCompleteness || 0,
        isVerified: details?.isVerified || false,
        isMentorAvailable: details?.isMentorAvailable || false,
        details,
      },
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
