// /app/actions/updateProfileAction.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export type UpdateProfilePayload = {
  authUserId: string; // Clerk user id (auth_user_id)
  degree: string;
  major: string;
  graduation_year?: number | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;

  company?: string | null;
  industry?: string | null;
  current_position?: string | null;
  employment_type?: string | null;

  website_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;

  // Accept either an array of strings (legacy) or a JSON object for skills depending on your schema usage.
  skills?: string[] | Record<string, any>;
  privacy?: {
    profile_visible?: boolean;
    email_visible?: boolean;
    graduation_year_visible?: boolean;
    [k: string]: any;
  };
};

/**
 * Server action: upsert profile (create if missing, update otherwise)
 * - Security: This is a server action. The client must pass authUserId.
 * - It will NOT change user_type or primary_organization_id except on create where we set a sensible default.
 */
export async function updateProfileAction(payload: UpdateProfilePayload) {
  // Verify authentication
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Ensure authUserId matches authenticated user
  if (payload.authUserId !== userId) {
    throw new Error("Unauthorized: authUserId mismatch");
  }

  const {
    authUserId,
    degree,
    major,
    graduation_year = null,
    bio = null,
    headline = null,
    location = null,
    company = null,
    industry = null,
    current_position = null,
    employment_type = null,
    website_url = null,
    linkedin_url = null,
    github_url = null,
    twitter_url = null,
    skills = [],
    privacy = { profile_visible: true, email_visible: false, graduation_year_visible: true },
  } = payload;

  if (!degree || !major) {
    throw new Error("Degree and major are required");
  }

  // Normalize skills: if array -> keep as array, if object -> keep as-is.
  // Your schema defines `skills` as Json? so either shape is ok. Adjust if you prefer one shape.
  const normalizedSkills = Array.isArray(skills) ? skills : skills ?? {};

  // Build metadata object to match your schema pattern
  const metadata = {
    major,
    professional: {
      company,
      industry,
      current_position,
      employment_type,
    },
    social: {
      website_url,
      linkedin_url,
      github_url,
      twitter_url,
    },
    privacy,
  };

  try {
    const upserted = await prisma.profiles.upsert({
      where: { auth_user_id: authUserId },
      create: {
        auth_user_id: authUserId,
        email: "", // Clerk webhook should have set email previously; leave blank fallback
        full_name: null,
        avatar_url: null,
        is_active: true,
        user_type: "alumni", // sensible default for newly created users; invites / admin can change later
        primary_organization_id: null,
        degree: degree || "",
        graduation_year: graduation_year ?? null,
        bio,
        headline,
        location,
        metadata,
        skills: normalizedSkills as any,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        degree: degree || "",
        graduation_year: graduation_year ?? null,
        bio,
        headline,
        location,
        metadata,
        skills: normalizedSkills as any,
        updated_at: new Date(),
      },
    });

    return upserted;
  } catch (err: any) {
    console.error("updateProfileAction error:", err);
    // For server action usage, rethrow so the caller can handle/display the error
    throw err;
  } finally {
    // Optional: don't disconnect Prisma in server actions as Next may reuse the instance.
    // If you run into connection limits in production, handle Prisma connection lifecycle elsewhere.
  }
}
