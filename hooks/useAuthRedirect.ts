// hooks/useAuthRedirect.ts
"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Any route starting with these should be protected
const PROTECTED_ROUTES = ["/dashboard", "/admin", "/profile", "/settings"];

export function useAuthRedirect() {
  const { profile: user, loading } = useAuthProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait until auth state is ready

    // ✅ Check if current path starts with any protected prefix
    const isProtected = PROTECTED_ROUTES.some((basePath) =>
      pathname === basePath || pathname.startsWith(`${basePath}/`)
    );

    // 🔒 Redirect unauthenticated users away from protected routes
    if (isProtected && !user) {
      router.replace("/sign-in");
      return;
    }

    // 🚪 Redirect authenticated users away from login/register pages
    const isAuthPage =
      pathname === "/sign-in" ||
      pathname === "/sign-up" ||
      pathname === "/";

    if (isAuthPage && user) {
      const target =
        user.userType === "admin" || user.userType === "super_admin"
          ? "/admin"
          : "/dashboard";
      router.replace(target);
    }
  }, [user, loading, pathname, router]);
}
