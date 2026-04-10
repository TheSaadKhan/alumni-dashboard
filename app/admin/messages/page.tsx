"use client";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  PenSquare, 
  RefreshCw, 
  Send, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminMessagesPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Relay Core Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-[0.3em]">Institutional Relay</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Global Transmission Core</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Communications Control</h1>
           <p className="text-slate-500 font-medium mt-1">Orchestrate platform-wide broadcasts and regulate entity-level interactions.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Relay Sync
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Radio className="h-4 w-4 mr-2" /> Initialize Broadcast
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Statistics & Pulse */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all">
              <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40">
                 <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                       <Zap className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic leading-none">Transmission Yield</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 {[
                   { label: "Matrix Reach", value: "94.2%", color: "text-blue-500" },
                   { label: "Engagement Opening", value: "68%", color: "text-emerald-500" },
                   { label: "Response Friction", value: "1.2%", color: "text-rose-500" },
                 ].map(stat => (
                    <div key={stat.label} className="group">
                       <div className="flex justify-between items-center mb-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className={`text-sm font-bold italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.color.replace('text', 'bg')} opacity-40`} style={{ width: stat.value }}></div>
                       </div>
                    </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8 relative group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              <div className="flex items-center gap-5 relative z-10">
                 <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <Send className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Scheduled Cycle</p>
                    <p className="text-xl font-bold italic tracking-tighter mt-1">2 Pending Dispatches</p>
                 </div>
              </div>
              <Button variant="ghost" className="w-full h-12 rounded-2xl border border-white/10 mt-8 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/5 relative z-10">
                 Queue Registry <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
           </Card>
        </div>

        {/* Relay Interface */}
        <div className="lg:col-span-3">
           <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-12 relative group">
              <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-slate-50/50 to-transparent"></div>
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl ring-1 ring-slate-100 transition-transform group-hover:scale-110 group-hover:rotate-3 relative z-10">
                 <Radio className="h-10 w-10 text-slate-200" />
              </div>
              <div className="mt-10 text-center space-y-4 max-w-sm relative z-10">
                 <h2 className="text-2xl font-bold uppercase italic tracking-tighter">Null Transmission</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-loose italic">No active broadcasting nodes or targeting protocols identified in the current institutional cycle.</p>
              </div>
              <div className="flex gap-4 mt-12 relative z-10">
                 <Button variant="outline" className="h-12 px-8 rounded-2xl border-none bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Mail className="h-4 w-4 mr-3" /> Template Nexus
                 </Button>
                 <Button className="h-12 px-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <Target className="h-4 w-4 mr-3" /> Audience Targeting
                 </Button>
              </div>
           </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Relay Governor v1.0.8 • Relay Hub</p>
      </footer>
    </div>
  );
}
