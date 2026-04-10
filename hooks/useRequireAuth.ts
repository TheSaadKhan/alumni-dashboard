// hooks/useRequireAuth.ts
"use client";


import { useAuthProfile } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAuth = () => {
  const { profile: user, loading } = useAuthProfile();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  return { user, loading };
};