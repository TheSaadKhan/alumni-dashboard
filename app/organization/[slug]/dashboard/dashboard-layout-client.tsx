"use client";

import { useState, useEffect } from "react";
import { RoleBasedSidebar } from "@/components/navigation/role-based-sidebar";
import { RoleBasedHeader } from "@/components/navigation/role-based-header";
import { useAuthProfile } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useAuthProfile();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
     if (!loading && profile) {
        const isSuperAdmin = profile.userType === 'super_admin';
        const hasOrg = !!profile.organizationId;
        if (!isSuperAdmin && !hasOrg && profile.status !== 'pending' && slug !== 'setup' && slug !== 'undefined') {
           router.replace("/auth/complete-profile/member");
        }
     }
  }, [profile, loading, slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
           <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
           <p className="text-xs font-medium text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (profile?.status === "pending" && profile?.userType !== "super_admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-2xl border border-slate-200">
           <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
           </div>
           <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">Access Pending</h1>
              <p className="text-sm text-slate-500">
                Your profile is currently under review. We will notify you once your access is approved.
              </p>
           </div>
           <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-11">
              Check Again
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <RoleBasedSidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <RoleBasedHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>

        <footer className="py-4 px-8 text-center bg-white border-t border-slate-200">
           <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
             AlumniHub Dashboard &copy; 2026
           </p>
        </footer>
      </div>
    </div>
  );
}
