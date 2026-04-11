"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Users, 
  Filter, 
  UserPlus, 
  Loader2,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Globe,
  Activity
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NetworkPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, connections: 0, newThisWeek: 0 });

  const fetchNetwork = useCallback(async () => {
    if (!profile?.organizationId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/network?organizationId=${profile.organizationId}&query=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.network || []);
        setStats({
          total: data.network?.length || 0,
          online: Math.floor((data.network?.length || 0) * 0.1),
          connections: 0,
          newThisWeek: Math.floor((data.network?.length || 0) * 0.05)
        });
      }
    } catch (err) {
      toast.error("Failed to synchronize network nodes");
    } finally {
      setLoading(false);
    }
  }, [profile, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile) fetchNetwork();
    }, 500);
    return () => clearTimeout(timer);
  }, [profile, fetchNetwork]);

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  if (!profile?.organizationId) {
    return (
      <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
         <Globe className="h-12 w-12 text-slate-100 mx-auto" />
         <div className="space-y-2">
            <h1 className="text-xl font-bold italic uppercase tracking-tighter">Isolated State</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">You are not currently associated with any institutional network segment.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/organization/setup")}>
            Establish Affiliation
         </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Directory</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.total} total members</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Institution Network</h1>
           <p className="text-slate-500 font-medium mt-1">Discover, connect, and collaborate with verified graduates.</p>
        </div>
        <Button className="h-12 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
           <UserPlus className="h-4.5 w-4.5 mr-2" /> Invite Member
        </Button>
      </div>

      {/* Grid Matrix Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Global Nodes", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Pulse", value: stats.online, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", pulse: true },
          { label: "Accepted Synergy", value: stats.connections, icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Cycle Growth", value: stats.newThisWeek, icon: RefreshCw, color: "text-rose-600", bg: "bg-rose-50" },
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
              {s.pulse && (
                <div className="ml-auto">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Protocol */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Filter identity via name, role, or skillset..."
            className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-200" />
            </div>
          )}
        </div>
        <Button variant="outline" className="h-12 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-900 shadow-sm border-none bg-white">
          <Filter className="h-4 w-4 mr-2" /> Refine
        </Button>
      </div>

      {/* Identity Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {alumni.map((person) => (
          <Card key={person.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-slate-50 dark:hover:border-slate-800">
             <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-end justify-center px-6 relative overflow-hidden group">
                <div className="absolute top-4 right-4 z-10">
                   <Badge variant="outline" className="bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-black uppercase border-none text-slate-500 tracking-widest shadow-sm">
                      Batch {person.graduationYear || person.expectedGraduation || "2024"}
                   </Badge>
                </div>
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <div className="px-6 -mt-10 relative z-10 flex flex-col items-center">
                <Avatar className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform">
                   <AvatarImage src={person.avatar} />
                   <AvatarFallback className="bg-slate-900 text-white font-black text-xl">{person.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center space-y-1">
                   <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase italic">{person.name}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none truncate max-w-[180px]">{person.headline || "Institution Entity"}</p>
                </div>
             </div>
             <CardContent className="p-8 pt-6 space-y-4">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <MapPin className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{person.location || "Earth Node"}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <GraduationCap className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{person.major || "Advanced Studies"}</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                   {(person.skills || []).slice(0, 2).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-[9px] uppercase tracking-widest font-black py-1 px-2.5 bg-slate-100 dark:bg-slate-800 border-none text-slate-400 rounded-lg">
                         {skill}
                      </Badge>
                   ))}
                </div>
             </CardContent>
             <CardFooter className="px-8 pb-8 pt-0 flex gap-3">
                <Button className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-500/10" onClick={() => router.push(`/dashboard/network/${person.id}`)}>
                   View Profile
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400">
                   <UserPlus className="h-4.5 w-4.5" />
                </Button>
             </CardFooter>
          </Card>
        ))}
      </div>

      {alumni.length === 0 && !loading && (
        <div className="py-24 text-center flex flex-col items-center space-y-6">
           <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-slate-200" />
           </div>
           <div className="space-y-2">
              <h4 className="text-xl font-bold italic uppercase tracking-tighter">Zero Nodes Detected</h4>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">The current filter matrix returned no corresponding institutional identifiers.</p>
           </div>
           <Button variant="outline" className="h-12 px-8 rounded-2xl font-bold text-slate-400" onClick={() => setSearchTerm("")}>
              System Reset
           </Button>
        </div>
      )}

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Network Synchronization Engine v1.0 • Global Directory</p>
      </footer>
    </div>
  );
}
