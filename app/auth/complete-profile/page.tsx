"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/context/AuthContext";
import { Loader2, LayoutDashboard } from "lucide-react";

function CompleteProfileRouterContent() {
  const router = useRouter();
  const { profile, organization, loading } = useAuthProfile();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace("/");
      return;
    }

    // Logic: Decide where to send them
    const isSuperAdmin = profile.userType === "super_admin" || profile.userType === "admin";
    
    // Guard: If onboarding is already DONE
    if (profile.onboardingCompleted) {
      if (isSuperAdmin) {
        router.replace("/admin");
        return;
      }
      
      if (profile.organizationId && organization?.slug) {
        router.replace(`/organization/${organization.slug}/dashboard`);
        return;
      }

      // If session is still loading the slug but they have the ID, we wait for it.
      // Do NOT fall through to the logic below which would send them back to the start of the form.
      if (profile.organizationId) {
        console.log("Onboarded but waiting for organization data sync...");
        return;
      }
    }

    if (isSuperAdmin) {
      router.replace("/auth/complete-profile/admin");
    } else {
      router.replace("/auth/complete-profile/member");
    }
  }, [profile, organization, loading, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-slate-950">
       <div className="relative mb-6">
          <div className="h-16 w-16 rounded-2xl border-4 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
          <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
       </div>
       <div className="text-center animate-pulse">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analyzing your permissions</h2>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Securing your session and preparing role-based access...</p>
       </div>
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