"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified complete-profile page as requested
    router.replace("/auth/complete-profile/member");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
        <p className="text-slate-500 font-medium">Redirecting to profile setup...</p>
      </div>
    </div>
  );
}