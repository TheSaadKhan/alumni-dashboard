// hooks/useRequireAuth.ts
"use client";


import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAuth = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  return { user, loading };
};