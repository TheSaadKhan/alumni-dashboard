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
   * ✅ API ROUTES SHOULD NOT REDIRECT TO HTML PAGES
   * Route handlers are responsible for returning proper 401/403 JSON.
   */
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

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
  let organizationSlug: string | null = null;

  try {
    const profileHeaders = new Headers(req.headers);
    profileHeaders.set("x-user-id", userId!);

    const profileRes = await fetch(
      `${req.nextUrl.origin}/api/internal/profile-status`,
      {
        headers: profileHeaders,
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
      organizationSlug = data.organization?.slug || null;
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
  if (pathname === "/") {
    if (userType === "super_admin" || userType === "admin") {
      url.pathname = "/admin";
    } else if (hasOrganization && organizationSlug) {
      url.pathname = `/organization/${organizationSlug}/dashboard`;
    } else {
      url.pathname = "/onboarding";
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
        : hasOrganization && organizationSlug
        ? `/organization/${organizationSlug}/dashboard`
        : "/dashboard";

    if (pathname !== target) {
      url.pathname = target;
      return NextResponse.redirect(url);
    }
  }

  /**
   * ✅ 5. SUPER ADMIN MUST CREATE ORGANIZATION
   */
  if (
    userType === "super_admin" &&
    !hasOrganization &&
    !pathname.startsWith("/auth/") &&
    pathname !== "/organization/setup"
  ) {
    url.pathname = "/organization/setup";
    return NextResponse.redirect(url);
  }

  // ✅ 6. PROFILE ENFORCEMENT
  const isCompletionFlow =
    pathname.startsWith("/auth/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/organization/setup");

  if (!hasProfile && !isCompletionFlow) {
    url.pathname = "/auth/complete-profile";
    return NextResponse.redirect(url);
  }

  /**
   * ✅ 7. ADMIN PANEL LOCK
   */
  if (pathname.startsWith("/admin")) {
    if (userType !== "admin" && userType !== "super_admin") {
      url.pathname = hasOrganization && organizationSlug 
        ? `/organization/${organizationSlug}/dashboard` 
        : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  /**
   * ✅ 8. DASHBOARD REDIRECT (NON-SLUGGED)
   */
  if (pathname === "/dashboard") {
    if (userType === "admin" || userType === "super_admin") {
      url.pathname = "/admin";
    } else if (hasOrganization && organizationSlug) {
      url.pathname = `/organization/${organizationSlug}/dashboard`;
    } else {
      url.pathname = "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  // ✅ 9. DASHBOARD SUB-ROUTES REDIRECT
  if (pathname.startsWith("/dashboard/")) {
    const subRoute = pathname.replace("/dashboard/", "");
    if (hasOrganization && organizationSlug) {
      url.pathname = `/organization/${organizationSlug}/dashboard/${subRoute}`;
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

