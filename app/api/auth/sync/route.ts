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

    // Sync to Clerk Public Metadata if missing or changed to reduce future API calls
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const meta = clerkUser.publicMetadata;
    
    if (meta.userType !== user.userType || meta.organizationId !== user.organizationId) {
       await client.users.updateUserMetadata(clerkId, {
         publicMetadata: {
           userType: user.userType,
           organizationId: user.organizationId,
           onboardingCompleted: user.status === UserStatus.active
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
        onboardingCompleted: user.status === UserStatus.active,
        metadata: user.metadata || {},
        // Flatten key detail fields for easy access by frontend pages
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
        // Social links as sub-object for profile page legacy access
        social: {
          linkedin_url: details?.linkedinUrl || null,
          github_url: details?.githubUrl || null,
          website_url: details?.websiteUrl || null,
          twitter_url: null,
        },
        // Professional info for profile page
        professional: {
          current_position: details?.currentTitle || null,
          company: details?.currentCompany || null,
          industry: details?.industry || null,
        },
        details,
      },
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
