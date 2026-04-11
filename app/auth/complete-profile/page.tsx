"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { syncUserMetadataAction } from "@/app/actions/syncUserMetadata";

// Removed dynamic export

function CompleteProfileRouterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState("Preparing your profile…");

  // Detect org-setup intent from the redirect param (must be outside useEffect for dep array)
  const redirectParam = searchParams.get("redirect") || searchParams.get("redirect_url") || "";
  const isOrgSetupIntent = redirectParam.includes("/organization/setup");
  const intent = isOrgSetupIntent ? "org_setup" : undefined;

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/");
      return;
    }

    async function detectRoleAndRoute() {
      // ✅ Fast path: role already in Clerk session publicMetadata
      const metaUserType = user!.publicMetadata?.userType as string | undefined;

      if (metaUserType) {
        const isSuperAdmin = metaUserType === "super_admin" || metaUserType === "admin";
        // If intent says org_setup but metadata says alumni, override (stale metadata)
        const effectiveSuperAdmin = isSuperAdmin || isOrgSetupIntent;
        router.replace(
          effectiveSuperAdmin
            ? "/auth/complete-profile/admin"
            : "/auth/complete-profile/member"
        );
        return;
      }

      // 🔄 Fallback: metadata empty — fetch from DB, optionally promote, write to Clerk
      setStatus("Syncing your account…");
      try {
        const { userType } = await syncUserMetadataAction(intent);
        const isSuperAdmin = userType === "super_admin" || userType === "admin";
        router.replace(
          isSuperAdmin
            ? "/auth/complete-profile/admin"
            : "/auth/complete-profile/member"
        );
      } catch (e) {
        console.error("Role sync failed, defaulting to member flow:", e);
        router.replace("/auth/complete-profile/member");
      }
    }

    detectRoleAndRoute();
  }, [isLoaded, user, router, searchParams, isOrgSetupIntent]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{status}</p>
    </div>
  );
}

export default function CompleteProfileRouter() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    }>
      <CompleteProfileRouterContent />
    </Suspense>
  );
}