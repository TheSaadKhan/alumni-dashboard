import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ✅ Public routes
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

  // auth
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth(.*)",

  // public api
  "/invite/accept",
  "/api/clerk-webhook",
  "/api/public(.*)",
]);

/**
 * ✅ Auth pages only
 */
const isAuthPage = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

/**
 * ✅ INTERNAL API — MUST NEVER BE TOUCHED BY MIDDLEWARE
 */
const isInternalApi = createRouteMatcher([
  "/api/internal(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  /**
   * ✅ 0. NEVER TOUCH INTERNAL API
   */
  if (isInternalApi(req)) {
    return NextResponse.next();
  }

  /**
   * ✅ 1. NOT LOGGED IN → ALLOW PUBLIC ROUTES ONLY
   */
  if (!userId && isPublicRoute(req)) {
    return NextResponse.next();
  }

  /**
   * ✅ 2. NOT LOGGED IN → BLOCK PROTECTED ROUTES
   */
  if (!userId && !isPublicRoute(req)) {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  /**
   * ✅ DEFAULT FALLBACKS (if API fails)
   */
  let userType: "super_admin" | "admin" | "alumni" | "student" | null = null;
  let hasProfile = true;
  let isProfileComplete = true;
  let hasOrganization = true;

  try {
    const profileRes = await fetch(
      `${req.nextUrl.origin}/api/internal/profile-status`,
      {
        headers: { "x-user-id": userId! },
        cache: "no-store",
      }
    );

    const contentType = profileRes.headers.get("content-type");

    if (profileRes.ok && contentType?.includes("application/json")) {
      const data = await profileRes.json();

      userType = data.userType;
      hasProfile = data.hasProfile;
      isProfileComplete = data.isProfileComplete;
      hasOrganization = data.hasOrganization;
    } else {
      console.error(
        "Middleware: profile-status returned non-JSON:",
        profileRes.status,
        contentType
      );
    }
  } catch (err) {
    console.error("Middleware: profile-status fetch failed:", err);
  }

  /**
   * ✅ 3. ROOT `/` AUTO-REDIRECT (NO LOOPS)
   */
  // ✅ ROOT `/` AUTO-REDIRECT BY ROLE (CLEAN & SAFE)
  if (pathname === "/") {
    if (userType === "super_admin" || userType === "admin") {
      url.pathname = "/admin";
    } else {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }


  /**
   * ✅ 4. LOGGED IN → BLOCK SIGN-IN & SIGN-UP
   */
  if (isAuthPage(req)) {
    const target =
      userType === "super_admin" || userType === "admin"
        ? "/admin"
        : "/dashboard";

    if (pathname !== target) {
      url.pathname = target;
      return NextResponse.redirect(url);
    }
  }

  /**
   * ✅ 5. PROFILE ENFORCEMENT
   */
  if (!hasProfile && pathname !== "/auth/complete-profile") {
    url.pathname = "/auth/complete-profile";
    return NextResponse.redirect(url);
  }

  if (!isProfileComplete && pathname !== "/auth/complete-profile") {
    url.pathname = "/auth/complete-profile";
    return NextResponse.redirect(url);
  }

  /**
   * ✅ 6. SUPER ADMIN MUST CREATE ORGANIZATION
   */
  if (
    userType === "super_admin" &&
    !hasOrganization &&
    pathname !== "/setup-organization"
  ) {
    url.pathname = "/setup-organization";
    return NextResponse.redirect(url);
  }

  /**
   * ✅ 7. ADMIN PANEL LOCK
   */
  if (pathname.startsWith("/admin")) {
    if (userType !== "admin" && userType !== "super_admin") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  /**
   * ✅ 8. DASHBOARD LOCK
   */
  if (pathname.startsWith("/dashboard")) {
    if (userType === "admin" || userType === "super_admin") {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

/**
 * ✅ EXCLUDE STATIC FILES
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
