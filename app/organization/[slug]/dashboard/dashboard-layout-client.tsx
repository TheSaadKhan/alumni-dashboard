"use client";

import { useState, useEffect } from "react";
import { RoleBasedSidebar } from "@/components/navigation/role-based-sidebar";
import { RoleBasedHeader } from "@/components/navigation/role-based-header";
import { useAuthProfile } from "@/context/AuthContext";
import { Clock, ShieldAlert, GraduationCap, Building2, LayoutDashboard, Search } from "lucide-react";
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
        
        // Only redirect if they are NOT a super admin AND have no organization assigned
        // AND are not on the setup page.
        // If they are pending, we STAY here to show the restricted access UI.
        if (!isSuperAdmin && !hasOrg && profile.status !== 'pending' && slug !== 'setup' && slug !== 'undefined') {
           router.replace("/auth/complete-profile/member");
        }
     }
  }, [profile, loading, slug, router]);

  // If loading, show a professional loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
              <div className="h-12 w-12 rounded-2xl border-4 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
              <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600" />
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Session</p>
        </div>
      </div>
    );
  }

  // CASE 1: Account Pending Approval (Restricted View)
  // Only show this for regular users (Alumni/Students), not Super Admins
  if (profile?.status === "pending" && profile?.userType !== "super_admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-xl w-full text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
           <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                 <Clock className="h-14 w-14 text-amber-500 animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-2xl border-4 border-slate-50 dark:border-slate-700">
                 <ShieldAlert className="h-6 w-6 text-amber-500" />
              </div>
           </div>

           <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Access Restricted</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                Your profile is currently <span className="text-amber-600 font-bold underline decoration-amber-200 underline-offset-4">Pending Verification</span> by institutional administrators.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                 </div>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Join Verification</p>
                 <p className="text-xs text-slate-500 mt-1">We've notified the admins at your institution to review your profile and academic details.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                 </div>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Org Features</p>
                 <p className="text-xs text-slate-500 mt-1">Activities, private events, and job boards are restricted until your affiliation is confirmed.</p>
              </div>
           </div>

           <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => window.location.reload()} className="h-14 flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 dark:shadow-none font-bold text-lg">
                 Check Review Status
              </Button>
              <Button variant="outline" onClick={() => router.push("/auth/complete-profile/member")} className="h-14 flex-1 rounded-2xl border-slate-200 font-bold">
                 View Submitted Info
              </Button>
           </div>

           <div className="flex items-center justify-center gap-2 text-slate-400">
              <Search className="h-3 w-3" />
              <p className="text-[10px] uppercase font-black tracking-widest">Expected Turnaround: 24h — 48h</p>
           </div>
        </div>
      </div>
    );
  }

  // CASE 2: No Organization assigned (and not on setup page or super admin)
  if (!profile?.organizationId && slug !== 'setup' && profile?.userType !== 'super_admin') {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8">
           <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-indigo-600 animate-bounce" />
           </div>
           <h2 className="text-2xl font-bold mb-2">Institution Required</h2>
           <p className="text-slate-500 mb-8 max-w-xs text-center">To access community features, you must be affiliated with an organization.</p>
           <Button onClick={() => router.push("/auth/complete-profile/member")} className="bg-indigo-600 rounded-xl px-10 h-12 font-bold">
              Join or Request Institution
           </Button>
        </div>
     );
  }

  // Authorized View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <RoleBasedSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <div className="fixed top-0 left-0 lg:left-64 right-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <RoleBasedHeader 
            onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        <main className="flex-1 pt-16 pb-6 px-4 sm:px-6 lg:px-8 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
