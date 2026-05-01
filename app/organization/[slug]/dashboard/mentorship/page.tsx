"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Target, 
  Users, 
  Calendar, 
  MessageCircle, 
  Star, 
  BookOpen, 
  GraduationCap, 
  RefreshCw,
  Plus,
  Clock,
  Check
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MentorshipPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const slug = organization?.slug || "default";
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorshipData = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const [mentorsRes, requestsRes] = await Promise.all([
        fetch("/api/mentorship?type=mentors"),
        fetch("/api/mentorship?type=requests")
      ]);
      if (mentorsRes.ok) setMentors((await mentorsRes.json()).mentors || []);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        const reqData = data.requests || { sent: [], received: [] };
        const flattened = [
          ...(reqData.sent || []),
          ...(reqData.received || []).map((r: any) => ({ 
            ...r, 
            mentee: r.student,
            mentorId: profile.id
          }))
        ];
        setRequests(flattened);
      }
    } catch (err) {
      toast.error("Failed to load mentorship data");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchMentorshipData();
  }, [profile, fetchMentorshipData]);

  const handleRequestMentor = async (mentorId: string) => {
    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId,
          goals: "Professional development",
          message: "I would like to request you as my mentor."
        })
      });
      if (res.ok) {
        toast.success("Request sent successfully!");
        fetchMentorshipData();
      }
    } catch (err) {
      toast.error("Failed to send request");
    }
  };

  const handleBecomeMentor = async () => {
    if (profile?.userType !== "alumni") {
      toast.error("Only alumni can become mentors");
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMentorAvailable: !profile.alumniProfile?.isMentorAvailable })
      });
      if (res.ok) {
        toast.success(profile.alumniProfile?.isMentorAvailable ? "Mentorship disabled" : "You are now a mentor!");
        window.location.reload(); 
      }
    } catch (err) {
      toast.error("Failed to update mentor status");
    }
  };

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
           <p className="text-slate-500 mt-1">Connect with experienced alumni or offer guidance to current students.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={fetchMentorshipData}>
             <RefreshCw className="h-4 w-4 mr-2" /> Refresh
           </Button>
           <Button 
             className={`h-11 rounded-xl font-bold px-6 shadow-lg transition-all ${profile?.alumniProfile?.isMentorAvailable ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             onClick={handleBecomeMentor}
           >
              {profile?.alumniProfile?.isMentorAvailable ? (
                <><Check className="h-4 w-4 mr-2" /> Mentoring Active</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Become a Mentor</>
              )}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Available Mentors", value: mentors.length, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Connections", value: requests.filter(r => r.status === 'accepted').length, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Resources Shared", value: "24", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Pending Requests", value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-xl`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="mentors">
        <TabsList className="mb-6">
          <TabsTrigger value="mentors">Available Mentors</TabsTrigger>
          <TabsTrigger value="my-connections">My Connections ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mentors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                 <CardHeader className="text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-slate-50">
                       <AvatarImage src={mentor.image} />
                       <AvatarFallback className="text-lg">{mentor.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{mentor.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500">{mentor.title || "Professional Mentor"}</CardDescription>
                 </CardHeader>
                 <CardContent className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                       <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                       <span>{mentor.experience || '5+'} years experience</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                       {(mentor.skills || mentor.topics || []).slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">{skill}</Badge>
                       ))}
                    </div>
                 </CardContent>
                 <CardFooter className="gap-2">
                    <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => router.push(`/organization/${slug}/dashboard/network/${mentor.id}`)}>View Profile</Button>
                    <Button className="flex-1 text-xs h-9" onClick={() => handleRequestMentor(mentor.id)}>Connect</Button>
                 </CardFooter>
              </Card>
            ))}
            {!mentors.length && !loading && (
               <div className="col-span-full py-20 text-center text-slate-500 border rounded-xl border-dashed">
                  No mentors found at this time.
               </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-connections">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const other = req.mentorId === profile?.id ? req.mentee : req.mentor;
              const isAccepted = req.status === 'accepted';
              return (
                <Card key={req.id} className="hover:shadow-md transition-shadow">
                   <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="h-12 w-12">
                         <AvatarImage src={other?.avatarUrl} />
                         <AvatarFallback>{other?.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold truncate">{other?.fullName}</h3>
                            <Badge variant={isAccepted ? 'default' : 'outline'} className="text-[10px]">
                               {req.status}
                            </Badge>
                         </div>
                         <p className="text-xs text-slate-500">{req.mentorId === profile?.id ? "Mentee" : "Mentor"}</p>
                      </div>
                   </CardHeader>
                   <CardContent>
                      <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 line-clamp-2 italic">
                         "{req.goals}"
                      </div>
                   </CardContent>
                   <CardFooter className="gap-2">
                      <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => router.push(`/organization/${slug}/dashboard/messages?userId=${other?.id}`)}>
                         <MessageCircle className="h-4 w-4 mr-2" /> Message
                      </Button>
                      {isAccepted && (
                        <Button className="flex-1 h-9 text-xs">Schedule Meeting</Button>
                      )}
                   </CardFooter>
                </Card>
              );
            })}
            {!requests.length && !loading && (
               <div className="col-span-full py-20 text-center text-slate-500 border rounded-xl border-dashed">
                  You don't have any active mentorship connections yet.
               </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}