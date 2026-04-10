"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  DollarSign, 
  Loader2, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  Filter, 
  ChevronRight,
  Heart,
  Calendar,
  CreditCard,
  Clock,
  MoreHorizontal,
  Target,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminDonationsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    completed: 0,
    pending: 0,
  });

  const orgId = (profile as any)?.organizationId;

  const loadData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/donations?organizationId=${orgId}&status=${statusFilter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = data.donations || [];
      setDonations(list);
      setStats({
        totalAmount: list.filter((d: any) => d.status === "completed").reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
        totalDonations: list.length,
        completed: list.filter((d: any) => d.status === "completed").length,
        pending: list.filter((d: any) => d.status === "pending").length,
      });
    } catch (err: any) {
      toast.error("Failed to synchronize philanthropic nodes");
    } finally {
      setLoading(false);
    }
  }, [orgId, statusFilter]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, loadData]);

  const filteredDonations = donations.filter((donation) => {
    const donorName = donation.profiles?.full_name || (donation.anonymous ? "Anonymous" : "Unknown");
    const donorEmail = donation.profiles?.email || "";
    return donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           donorEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && donations.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Philanthropy Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Philanthropy Governance</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.completed} Verified Transfers</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Audit Hub</h1>
           <p className="text-slate-500 font-medium mt-1">Track institutional asset flow and analyze philanthropic donor engagement.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Yield Sync
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Download className="h-4 w-4 mr-2" /> Export Ledger
           </Button>
        </div>
      </div>

      {/* Pulse Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Aggregate Yield", value: `$${stats.totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Donor Volume", value: stats.totalDonations, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Verified Nodes", value: stats.completed, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Stream", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-sm shadow-black/5`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tighter">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Yield Infrastructure Hub */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="IDENTIFY DONOR BY NAME OR EMAIL RELAY..." 
                 className="pl-12 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-blue-500/10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase px-6">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                     <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Global State</SelectItem>
                     <SelectItem value="completed" className="text-[10px] font-black uppercase tracking-widest">Completed</SelectItem>
                     <SelectItem value="pending" className="text-[10px] font-black uppercase tracking-widest">Pending Node</SelectItem>
                     <SelectItem value="failed" className="text-[10px] font-black uppercase tracking-widest">Terminated</SelectItem>
                  </SelectContent>
               </Select>
               <Button variant="ghost" className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-white shadow-sm">
                  <Filter className="h-4 w-4 mr-2" /> Global Protocol
               </Button>
            </div>
         </div>

         <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Institutional Benefactor</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Asset Value</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Transfer Protocol</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Compliance</TableHead>
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Temporal Data</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredDonations.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center py-24 text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Financial audit stream empty for this cycle.</TableCell>
                     </TableRow>
                   ) : (
                     filteredDonations.map((donation) => (
                       <TableRow key={donation.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                         <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                               <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                                  <AvatarImage src={donation.profiles?.avatar_url} />
                                  <AvatarFallback className="bg-slate-900 text-white font-black text-[10px] italic">{(donation.profiles?.full_name || "D")[0]}</AvatarFallback>
                               </Avatar>
                               <div>
                                  <p className="text-sm font-bold text-slate-900 uppercase italic leading-none truncate max-w-[180px]">{donation.profiles?.full_name || (donation.anonymous ? "Restricted Identity" : "Identity Masked")}</p>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">{donation.anonymous ? "Privacy Enabled" : donation.profiles?.email}</p>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                            <p className="text-base font-bold text-slate-900 italic tracking-tighter">${donation.amount?.toLocaleString()}</p>
                         </TableCell>
                         <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                               <CreditCard className="h-4 w-4 text-slate-300" />
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{donation.payment_method?.toUpperCase() || "DIGITAL DIRECT"}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${donation.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400'} mb-1`}></span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{donation.status.toUpperCase()}</span>
                             </div>
                         </TableCell>
                         <TableCell className="px-8 text-right underline decoration-slate-100 decoration-2 underline-offset-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                               {donation.created_at ? format(new Date(donation.created_at), 'MMM dd, yyyy') : "Archived"}
                            </p>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </div>
            <CardFooter className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Institutional Funds: Encrypted & Verified</p>
               <Button variant="ghost" className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-blue-600 hover:bg-blue-50">
                  Global Transparency <ChevronRight className="h-3 w-3 ml-2" />
               </Button>
            </CardFooter>
         </Card>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Yield Governor v1.0.6 • Philanthropy Audit</p>
      </footer>
    </div>
  );
}
