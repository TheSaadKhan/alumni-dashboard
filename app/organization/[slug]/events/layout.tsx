"use client";

import { useState } from "react";
import { RoleBasedSidebar } from "@/components/navigation/role-based-sidebar";
import { RoleBasedHeader } from "@/components/navigation/role-based-header";
import { useAuthProfile } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EventsLayout({
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
           <p className="text-xs font-medium text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <RoleBasedSidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <RoleBasedHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1">
          {children}
        </main>

        <footer className="py-4 px-8 text-center bg-white border-t border-slate-200">
           <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
             AlumniHub &copy; 2026
           </p>
        </footer>
      </div>
    </div>
  );
}
