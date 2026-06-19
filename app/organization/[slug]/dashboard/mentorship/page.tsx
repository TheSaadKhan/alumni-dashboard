"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, MessageCircle, Star, RefreshCw, Clock, Check,
  GraduationCap, Loader2, Briefcase, Inbox, ArrowUpRight
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function MentorshipPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const orgId = profile?.organizationId;
  const slug = organization?.slug || "default";

  const fetchMentorshipData = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any>(`mentorship_${orgId}`);
      if (cached) { setMentors(cached.mentors); setRequests(cached.requests); setLoading(false); }
      else setLoading(true);
    }
    try {
      const [mentorsRes, requestsRes] = await Promise.all([
        fetch(`/api/mentorship?type=mentors&organizationId=${orgId}`, { cache: "no-store" }),
        fetch(`/api/mentorship?type=requests&organizationId=${orgId}`, { cache: "no-store" }),
      ]);
      if (mentorsRes.ok && requestsRes.ok) {
        const mData = await mentorsRes.json();
        const rData = await requestsRes.json();
        
        const loadedMentors = mData.mentors || [];
        const reqData = rData.requests || { sent: [], received: [] };
        const loadedRequests = [
          ...(reqData.sent || []).map((r: any) => ({
            ...r,
            isReceived: false,
            displayUser: r.mentor || { fullName: r.mentor?.name, avatarUrl: r.mentor?.avatar, id: r.mentor?.id },
          })),
          ...(reqData.received || []).map((r: any) => ({
            ...r,
            isReceived: true,
            displayUser: r.student || { fullName: r.student?.name, avatarUrl: r.student?.avatar, id: r.student?.id },
          })),
        ];

        setMentors(loadedMentors);
        setRequests(loadedRequests);
        sessionSet(`mentorship_${orgId}`, { mentors: loadedMentors, requests: loadedRequests }, 5 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load mentorship data");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) fetchMentorshipData();
  }, [orgId, fetchMentorshipData]);

  const handleRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/mentorship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: action === "accepted" ? "accept" : "decline",
        }),
      });
      if (res.ok) {
        toast.success(`Request ${action === "accepted" ? "accepted" : "declined"} successfully`);
        fetchMentorshipData(true);
      } else {
        toast.error("Failed to update request");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  if (profileLoading && !mentors.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentorship Program</h1>
          <p className="text-slate-500 font-medium text-sm">Find guidance or share your expertise with the community.</p>
        </div>
        <Button variant="ghost" onClick={() => fetchMentorshipData()} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs defaultValue="explore" className="space-y-8">
        <TabsList className="bg-slate-50 p-1 rounded-2xl border border-slate-100 w-auto h-auto">
          <TabsTrigger value="explore" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Explore Mentors</TabsTrigger>
          <TabsTrigger value="requests" className="px-6 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
          {loading && !mentors.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)}
            </div>
          ) : mentors.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-900">No mentors available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
                  <div className="h-12 bg-gradient-to-r from-blue-50 to-indigo-50/50" />
                  <CardContent className="px-6 pb-6 -mt-8 flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 rounded-2xl border-4 border-white shadow-sm">
                      <AvatarImage src={mentor.image || mentor.user?.avatarUrl} />
                      <AvatarFallback className="bg-blue-600 text-white font-bold">
                        {(mentor.name || mentor.user?.fullName)?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-3 space-y-1">
                      <h3 className="text-base font-bold text-slate-900">{mentor.name || mentor.user?.fullName}</h3>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                        {mentor.title || mentor.currentTitle || "Expert Mentor"}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                       {(mentor.skills || mentor.expertise || mentor.topics || []).slice(0, 3).map((e: string) => (
                         <Badge key={e} variant="outline" className="text-[9px] font-bold border-slate-100 bg-slate-50/50 text-slate-500 rounded-lg">{e}</Badge>
                       ))}
                    </div>
                    <p className="mt-4 text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed italic">
                      "{mentor.headline || mentor.bio || "Happy to help students and fellow alumni grow."}"
                    </p>
                    <div className="mt-6 flex flex-col gap-2 w-full">
                       <Button onClick={() => router.push(`/organization/${slug}/dashboard/network/${mentor.id}`)} className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
                          View Profile
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="animate-in slide-in-from-bottom-2 duration-400">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <Card key={req.id} className="rounded-3xl border-none shadow-sm bg-white p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-slate-100">
                      <AvatarImage src={req.displayUser?.avatarUrl} />
                      <AvatarFallback className="bg-slate-50 text-slate-400 font-bold">{req.displayUser?.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{req.displayUser?.fullName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.isReceived ? "Student Request" : "Mentor"}</p>
                    </div>
                  </div>
                  <Badge className={`rounded-lg px-2 py-0.5 text-[8px] font-bold uppercase ${
                    req.status === "accepted" ? "bg-emerald-50 text-emerald-600" : 
                    req.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {req.status}
                  </Badge>
                </div>
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <p className="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-3">
                     \"{req.message || "No message provided."}\"
                   </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {req.isReceived && req.status === "pending" ? (
                    <>
                      <Button onClick={() => handleRequestAction(req.id, "accepted")} disabled={!!actionLoading} className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        Accept
                      </Button>
                      <Button onClick={() => handleRequestAction(req.id, "rejected")} disabled={!!actionLoading} variant="ghost" className="flex-1 h-10 rounded-xl text-rose-500 hover:bg-rose-50 font-bold text-xs">
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => router.push(`/organization/${slug}/dashboard/messages?userId=${req.displayUser?.id}`)} className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
                       <MessageCircle className="h-4 w-4 mr-2" /> Message
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {requests.length === 0 && (
              <div className="col-span-full py-24 text-center space-y-4">
                 <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                   <Clock className="h-8 w-8 text-slate-200" />
                 </div>
                 <p className="text-sm font-bold text-slate-400">No active mentorship requests found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}