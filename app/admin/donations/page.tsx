"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  IndianRupee,
  RefreshCw,
  Download,
  Filter,
  Heart,
  Clock,
  ShieldCheck,
  CreditCard,
  Inbox,
  ArrowUpRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function AdminDonationsPage() {
  const { profile } = useAuthProfile();
  const router = useRouter();
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

  const orgId = profile?.organizationId;

  const loadData = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any>(`admin_donations_${orgId}`);
      if (cached) { setDonations(cached.list); setStats(cached.stats); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/donations?organizationId=${orgId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = data.donations || [];
      const newStats = {
        totalAmount: list.filter((d: any) => d.status === "completed").reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
        totalDonations: list.length,
        completed: list.filter((d: any) => d.status === "completed").length,
        pending: list.filter((d: any) => d.status === "pending").length,
      };
      setDonations(list);
      setStats(newStats);
      sessionSet(`admin_donations_${orgId}`, { list, stats: newStats }, 5 * 60 * 1000);
    } catch (err) {
      toast.error("Failed to load donation data");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, loadData]);

  const filteredDonations = donations.filter((donation) => {
    const donorName = donation.user?.fullName || (donation.isAnonymous ? "Anonymous" : "Unknown");
    const matchesSearch = donorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Donations</h1>
          <p className="text-slate-500 font-medium text-sm">Monitor fundraising and community contributions.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            onClick={() => loadData()}
            className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
          </Button>
          <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold px-5 shadow-sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Raised", value: `₹${stats.totalAmount.toLocaleString()}`, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Total Donations", value: stats.totalDonations, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search donors..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "completed", "pending", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Donations List */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
        {loading && donations.length === 0 ? (
          <div className="p-0">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
              <CreditCard className="h-8 w-8 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">No donations found</p>
              <p className="text-xs text-slate-400">Wait for the community to contribute.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[300px] text-xs font-bold uppercase tracking-widest text-slate-400 px-8 py-5">Donor</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Amount</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5 text-right px-8">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => {
                  const donorName = donation.user?.fullName || (donation.isAnonymous ? "Anonymous" : "Unknown Donor");
                  return (
                    <TableRow key={donation.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl shadow-sm">
                            <AvatarImage src={donation.user?.avatarUrl} />
                            <AvatarFallback className="bg-slate-100 text-slate-400 text-xs font-bold">{donorName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{donorName}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{donation.user?.email || "No email available"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <p className="text-sm font-bold text-slate-900">₹{donation.amount?.toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="py-6">
                        <p className="text-xs font-bold text-slate-500">{format(new Date(donation.createdAt), "MMM dd, yyyy")}</p>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase border-none ${
                          donation.status === "completed" ? "bg-emerald-50 text-emerald-600" : 
                          donation.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        }`}>
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8 py-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => router.push(`/admin/donations/${donation.id}`)}>
                          <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
