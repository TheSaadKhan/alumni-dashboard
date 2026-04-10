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
  ChevronRight, 
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
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Audit Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Institutional Analytics</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Standardized Reporting</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Audit Ledger</h1>
           <p className="text-slate-500 font-medium mt-1">Generate and analyze institutional datasets for strategic decision protocols.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <Filter className="h-4 w-4 mr-2" /> Protocol Filter
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <RefreshCw className="h-4 w-4 mr-2" /> Initialize New Audit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Behavioral Analytics", desc: "User engagement, interaction cycles, and platform loyalty metrics.", icon: Activity, color: "blue", yield: "+4.2%" },
          { title: "Philanthropy Summary", desc: "Comprehensive yield report outlining all alumni financial contributions.", icon: Award, color: "emerald", yield: "$240K" },
          { title: "Talent Metrics", desc: "Career Trajectory analysis and recruitment conversion telemetry.", icon: TrendingUp, color: "purple", yield: "12%" },
          { title: "Network Synergy", desc: "Connection density and mentorship program outcomes for current cycles.", icon: Users, color: "rose", yield: "High" },
          { title: "Governance Audit", desc: "Security posture and entity verification status across organization nodes.", icon: ShieldCheck, color: "amber", yield: "100%" },
          { title: "Technical Heartbeat", desc: "System performance logs, API load cycles and infrastructure health.", icon: Database, color: "slate", yield: "Optimal" },
        ].map((report, idx) => (
          <Card key={idx} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden hover:translate-y-[-4px] transition-all group">
             <CardHeader className="p-10 pb-4 relative">
                <div className={`h-14 w-14 rounded-2xl bg-${report.color}-50 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                   <report.icon className={`h-7 w-7 text-${report.color}-600`} />
                </div>
                <div className="absolute top-10 right-10 flex flex-col items-end">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none italic">Cycle Yield</p>
                   <p className={`text-lg font-bold italic tracking-tighter mt-1 text-${report.color}-600`}>{report.yield}</p>
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-tight italic leading-none">{report.title}</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 leading-loose">{report.desc}</CardDescription>
             </CardHeader>
             <CardContent className="p-10 pt-6 mt-2 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <CalendarIcon className="h-3.5 w-3.5 text-slate-300" />
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Last Audit: 48h Ago</span>
                </div>
                <Button variant="ghost" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                   <Download className="h-3.5 w-3.5 mr-2" /> PDF Asset
                </Button>
             </CardContent>
          </Card>
        ))}
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Audit Infrastructure Active • Verified System Records Only</p>
      </footer>
    </div>
  );
}
