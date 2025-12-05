// components/protectedRoutes.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner"; // optional: replace with your loader

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/"); // or your sign-in path
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {/* Simple loader */}
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          <Spinner />
          <p className="mt-2 text-sm text-muted-foreground">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
