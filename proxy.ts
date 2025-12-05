import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ✅ Public routes that don't require authentication
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/pricing",
  "/demo",
  "/privacy",
  "/terms",
  "/support",
  "/stories(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth(.*)",
  "/invite/accept",
  "/api/clerk-webhook",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();

  /**
   * ✅ Always allow public routes & unauthenticated users
   */
  if (isPublicRoute(req) || !userId) {
    return NextResponse.next();
  }

  try {
    /**
     * ✅ Call internal API (Edge-safe)
     */
    const profileRes = await fetch(
      `${req.nextUrl.origin}/api/internal/profile-status`,
      {
        headers: {
          "x-user-id": userId, // ✅ Secure Clerk v5 header
        },
      }
    );

    if (!profileRes.ok) {
      return NextResponse.next();
    }

    const {
      hasProfile,
      isProfileComplete,
      userType,
      hasOrganization,
    } = await profileRes.json();

    /**
     * ✅ No profile → force profile completion
     */
    if (!hasProfile && url.pathname !== "/auth/complete-profile") {
      url.pathname = "/auth/complete-profile";
      return NextResponse.redirect(url);
    }

    /**
     * ✅ Incomplete profile → enforce completion
     */
    if (!isProfileComplete && url.pathname !== "/auth/complete-profile") {
      // ✅ Allow setup-organization ONLY for super_admin
      if (
        userType === "c" &&
        url.pathname === "/setup-organization"
      ) {
        return NextResponse.next();
      }

      url.pathname = "/auth/complete-profile";
      return NextResponse.redirect(url);
    }

    /**
     * ✅ Super admin must have an organization
     */
    if (userType === "super_admin") {
      if (
        !hasOrganization &&
        url.pathname !== "/setup-organization" &&
        url.pathname !== "/auth/complete-profile"
      ) {
        url.pathname = "/setup-organization";
        return NextResponse.redirect(url);
      }
    }

    /**
     * ✅ Allow profile updates anytime
     */
    if (url.pathname === "/auth/complete-profile") {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Proxy middleware error:", err);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
