// components/ProtectedRoute.tsx
"use client";


import { useAuthContext } from "@/context/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();
  
  // Handle redirects
  useAuthRedirect();

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}