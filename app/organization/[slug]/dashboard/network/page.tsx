"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Briefcase, GraduationCap, Users, UserPlus,
  Loader2, Globe, MessageCircle, Filter, Inbox, ChevronRight
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function NetworkPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  const orgId = profile?.organizationId;
  const slug = organization?.slug || "default";

  const fetchNetwork = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any[]>(`network_${orgId}`);
      if (cached) { setMembers(cached); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/network?organizationId=${orgId}&query=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        const network = data.network || [];
        setMembers(network);
        sessionSet(`network_${orgId}`, network, 5 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load community network");
    } finally {
      setLoading(false);
    }
  }, [orgId, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orgId) fetchNetwork(members.length > 0);
    }, 400);
    return () => clearTimeout(timer);
  }, [orgId, searchTerm, fetchNetwork]);

  const filteredMembers = members.filter(m => filter === "all" || m.userType === filter);

  if (profileLoading && !members.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community Network</h1>
          <p className="text-slate-500 font-medium text-sm">Connect and grow with fellow institution members.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => router.push(`/organization/${slug}/dashboard/network/invite`)} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/20">
            Invite Friend
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search by name, role, or company..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "alumni", "student"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {loading && !members.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 space-y-4">
              <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
              <div className="space-y-2 text-center">
                <Skeleton className="h-4 w-32 rounded-lg mx-auto" />
                <Skeleton className="h-3 w-24 rounded-lg mx-auto" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">No members found</p>
            <p className="text-xs text-slate-400">Try a different search or filter.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-16 bg-gradient-to-br from-slate-50 to-blue-50/50 group-hover:from-blue-100/50 group-hover:to-purple-100/50 transition-colors" />
              <CardContent className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 rounded-[1.75rem] border-4 border-white shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xl">{member.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 space-y-1 w-full">
                  <h3 className="text-base font-bold text-slate-900 truncate">{member.name}</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{member.userType.replace('_', ' ')}</p>
                </div>

                <div className="mt-4 flex flex-col items-center gap-1.5 w-full">
                   <p className="text-xs font-medium text-slate-500 line-clamp-1 flex items-center gap-1">
                     <Briefcase className="h-3 w-3" /> {member.currentTitle || member.major || "Member"}
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                     <MapPin className="h-3 w-3" /> {member.location || "Earth"}
                   </p>
                </div>

                <div className="mt-6 flex flex-col gap-2 w-full">
                  <Button 
                    onClick={() => router.push(`/organization/${slug}/dashboard/network/${member.id}`)}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push(`/organization/${slug}/dashboard/messages?userId=${member.id}`)}
                    className="w-full h-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 font-bold text-xs"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
