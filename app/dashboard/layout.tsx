"use client";

import { useState } from "react";
import { AlumniSidebar } from "@/components/dashboard/alumni-sidebar";
import { AlumniHeader } from "@/components/dashboard/alumni-heder";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Fixed Sidebar */}
      <AlumniSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="md:ml-72 min-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 md:left-72 right-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
          <AlumniHeader 
            onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 pt-16 pb-6 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}