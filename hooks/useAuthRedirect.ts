// hooks/useAuthRedirect.ts
"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Any route starting with these should be protected
const PROTECTED_ROUTES = ["/dashboard", "/profile", "/settings"];

export function useAuthRedirect() {
  const { user, loading } = useAuthContext();
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
      router.replace("/auth/login");
      return;
    }

    // 🚪 Redirect authenticated users away from login/register pages
    const isAuthPage =
      pathname === "/auth/login" ||
      pathname === "/auth/register" ||
      pathname === "/";

    if (isAuthPage && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);
}
