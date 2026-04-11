"use client";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Filter,
  ShieldCheck,
  TrendingUp,
  Activity,
  Award,
  Database,
  Users
} from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">System Audit & Reports</h1>
           <p className="text-slate-500 mt-1">Generate and analyze institutional datasets and system logs.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline">
             <Filter className="h-4 w-4 mr-2" /> Filter
           </Button>
           <Button className="bg-indigo-600 hover:bg-indigo-700">
              <RefreshCw className="h-4 w-4 mr-2" /> New Audit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "User Engagement", desc: "Detailed analysis of user interactions and platform activity.", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Financial Summary", desc: "Report outlining all alumni donations and financial contributions.", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Career Placement", desc: "Statistics on job applications and successful hires.", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Network Growth", desc: "Connection density and mentorship program participation.", icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
          { title: "Security Audit", desc: "Review of system access, permissions, and verification states.", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "System Health", desc: "Technical logs regarding API performance and database status.", icon: Database, color: "text-slate-600", bg: "bg-slate-50" },
        ].map((report, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
             <CardHeader className="pb-4">
                <div className={`h-12 w-12 rounded-xl ${report.bg} flex items-center justify-center mb-4`}>
                   <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription className="text-sm">{report.desc}</CardDescription>
             </CardHeader>
             <CardContent className="pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                   <CalendarIcon className="h-3 w-3" />
                   <span>Last updated: 2 days ago</span>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600">
                   <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
                </Button>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
