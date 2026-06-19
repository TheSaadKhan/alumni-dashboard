"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, organization, loading } = useAuthProfile();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace("/sign-in");
      return;
    }

    if (profile.onboardingCompleted) {
      if (profile.userType === "admin" || profile.userType === "super_admin") {
        router.replace(hasOrganization(profile) ? "/admin" : "/organization/setup");
        return;
      }
      if (organization?.slug) {
        router.replace(`/organization/${organization.slug}/dashboard`);
        return;
      }
    }

    const isAdmin =
      profile.userType === "super_admin" || profile.userType === "admin";

    router.replace(
      isAdmin ? "/auth/complete-profile/admin" : "/auth/complete-profile/member"
    );
  }, [profile, organization, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-slate-500 font-medium">Setting up your account...</p>
      </div>
    </div>
  );
}

function hasOrganization(profile: { organizationId?: string | null }) {
  return !!profile.organizationId;
}
