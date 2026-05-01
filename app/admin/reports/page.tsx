"use client";

import { useState } from "react";
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
  Users,
  Search,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const reports = [
    { title: "User Engagement", desc: "Detailed analysis of user interactions and platform activity.", icon: Activity, color: "text-blue-600", bg: "bg-blue-50", category: "Activity" },
    { title: "Financial Summary", desc: "Report outlining all alumni donations and financial contributions.", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50", category: "Finance" },
    { title: "Career Placement", desc: "Statistics on job applications and successful hires.", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", category: "Careers" },
    { title: "Network Growth", desc: "Connection density and mentorship program participation.", icon: Users, color: "text-rose-600", bg: "bg-rose-50", category: "Social" },
    { title: "Security Audit", desc: "Review of system access, permissions, and verification states.", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50", category: "Security" },
    { title: "System Health", desc: "Technical logs regarding API performance and database status.", icon: Database, color: "text-slate-600", bg: "bg-slate-50", category: "Technical" },
  ];

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit & Reports</h1>
           <p className="text-slate-500 font-medium text-sm">Generate and analyze institutional datasets and system logs.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" className="h-10 rounded-xl bg-slate-50 font-bold text-xs">
              <RefreshCw className="h-4 w-4 mr-2" /> New Audit
           </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search reports by title or category..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-xs font-bold">
              <Filter className="h-3.5 w-3.5 mr-2" /> Filter
           </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredReports.map((report, idx) => (
          <Card key={idx} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
             <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex justify-between items-start mb-4">
                   <div className={`h-12 w-12 rounded-2xl ${report.bg} flex items-center justify-center`}>
                      <report.icon className={`h-6 w-6 ${report.color}`} />
                   </div>
                   <Badge className="bg-slate-50 text-slate-400 border-none rounded-lg text-[9px] font-bold uppercase tracking-wider">{report.category}</Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{report.title}</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 leading-relaxed mt-1">{report.desc}</CardDescription>
             </CardHeader>
             <CardContent className="px-8 pb-8 pt-4">
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Updated 2d ago</span>
                   </div>
                   <Button variant="ghost" size="sm" className="h-9 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-xs">
                      <Download className="h-3.5 w-3.5 mr-2" /> Export
                   </Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Audits Table Placeholder */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Recent System Logs</h3>
            <Button variant="ghost" className="h-8 text-xs font-bold text-blue-600">View All Logs</Button>
         </div>
         <div className="space-y-4">
            {[1, 2, 3].map((i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-50 group hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <FileText className="h-5 w-5 text-slate-300" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-900">Weekly Performance Report</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Generated by System • 12:45 PM</p>
                     </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
               </div>
            ))}
         </div>
      </Card>
    </div>
  );
}
