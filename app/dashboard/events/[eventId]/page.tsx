"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, Share2, Bookmark, ArrowLeft, Loader2, Link as LinkIcon, CheckCircle2, Info, Video, Building2, Globe, Ticket, DollarSign, Zap, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  descriptionHtml: string | null;
  eventType: string;
  mode: string;
  locationName: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  meetingLink: string | null;
  meetingPassword: string | null;
  bannerUrl: string | null;
  thumbnailUrl: string | null;
  maxCapacity: number | null;
  registeredCount: number;
  waitlistCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  requiresApproval: boolean;
  isPaid: boolean;
  price: number | null;
  currencyCode: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  viewCount: number;
  extraData: any;
  organizer: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  speakers: Array<{
    id: string;
    name: string;
    title: string | null;
    company: string | null;
    bio: string | null;
    avatarUrl: string | null;
    topic: string | null;
  }>;
  registrations: Array<{
    id: string;
    status: string;
    registeredAt: string;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  }>;
  userRegistration?: {
    id: string;
    status: string;
    registeredAt: string;
  } | null;
  isRegistered: boolean;
  isWaitlisted: boolean;
  availableSpots: number | null;
  isFull: boolean;
  canRegister: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuthProfile();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMeetingLink, setShowMeetingLink] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      toast.error("Failed to synchronize event node");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!profile) {
      toast.error("Identity authentication required");
      return;
    }

    if (!event?.canRegister) {
      toast.error("Registration cycle unavailable");
      return;
    }

    try {
      setRegistering(true);
      const res = await fetch("/api/dashboard/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.registration?.isWaitlisted) {
          toast.success("Added to waitlist queue");
        } else if (data.registration?.requiresApproval) {
          toast.success("Engagement pending verification");
        } else {
          toast.success("Engagement node established");
        }
        fetchEvent();
      } else {
        toast.error(data.error || "Failed to establish link");
      }
    } catch (err) {
      toast.error("Failed to transmit registration packet");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm("Terminate engagement node?")) return;

    try {
      setRegistering(true);
      const res = await fetch(`/api/dashboard/events?eventId=${event?.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Engagement terminated");
        fetchEvent();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to sever link");
      }
    } catch (err) {
      toast.error("Failed to transmit termination signal");
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Node URL copied to clipboard");
    } catch (err) {
      toast.error("Clipboard access failed");
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
         <div className="h-16 w-16 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <Info className="h-8 w-8 text-rose-500" />
         </div>
         <div className="space-y-3">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Event Not Found</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">The requested engagement node has been isolated or relocated.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/dashboard/events")}>
            Back to Calendar
         </Button>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Interface Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 text-slate-400" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">{event.eventType.replace('_', ' ')}</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{event.mode.replace('_', ' ')}</span>
              </div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">{event.title}</h1>
           </div>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50" onClick={handleShare}>
              <Share2 className="h-5 w-5 text-slate-400" />
           </Button>
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50" onClick={() => setIsBookmarked(!isBookmarked)}>
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "text-indigo-600 fill-current" : "text-slate-400"}`} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* EVENT CORE */}
        <div className="lg:col-span-2 space-y-10">
          {/* BANNER ASSET */}
          <div className="relative h-[440px] rounded-[3rem] overflow-hidden shadow-sm group">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 flex flex-wrap gap-4">
               <div className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/10">
                  <Calendar className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{format(startDate, "MMM dd, yyyy")}</span>
               </div>
               <div className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/10">
                  <Clock className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}</span>
               </div>
               <div className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/10">
                  <MapPin className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{event.locationCity || "ONLINE"}</span>
               </div>
            </div>
          </div>

          {/* DISCOURSE */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="p-10 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
               <CardTitle className="text-xl font-black uppercase tracking-tight italic">Engagement Discourse</CardTitle>
            </CardHeader>
            <CardContent className="p-10">
               <div className="prose prose-indigo dark:prose-invert max-w-none">
                  {event.descriptionHtml ? (
                     <div dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} className="text-sm font-medium text-slate-600 leading-relaxed italic" />
                  ) : (
                     <p className="text-sm font-bold font-medium text-slate-500 leading-relaxed italic">
                        "{event.description || "No extensive discourse provided for this engagement node."}"
                     </p>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* SPECTRUM (Speakers) */}
          {event.speakers?.length > 0 && (
            <div className="space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] ml-6 text-slate-300">Expert Panel Spectrum</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.speakers.map((speaker) => (
                    <Card key={speaker.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 backdrop-blur-md overflow-hidden p-6 hover:translate-y-[-4px] transition-all">
                       <div className="flex gap-5">
                          <Avatar className="h-20 w-20 rounded-2xl border-4 border-white shadow-xl">
                             <AvatarImage src={speaker.avatarUrl || ""} className="object-cover" />
                             <AvatarFallback className="bg-slate-900 text-white font-black">{speaker.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 py-1 space-y-2">
                             <h4 className="text-base font-black uppercase italic tracking-tighter truncate">{speaker.name}</h4>
                             <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate">{speaker.title || "Subject Matter expert"}</p>
                             <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-slate-300" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{speaker.company || "Independent Node"}</p>
                             </div>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* SIDEBAR PROTOCOLS */}
        <div className="space-y-10">
          {/* REGISTRATION CORE */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-slate-900 text-white overflow-hidden p-8 sticky top-24">
             <div className="space-y-8">
                <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Valuation</p>
                      <p className="text-2xl font-black italic tracking-tighter mt-1">{event.isPaid ? `${event.price} ${event.currencyCode}` : "OPEN ACCESS"}</p>
                   </div>
                   <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Ticket className="h-5 w-5" />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                      <span className="text-slate-500 italic">Load Capacity</span>
                      <span>{event.registeredCount} / {event.maxCapacity || '∞'} INSTALLED</span>
                   </div>
                   {event.maxCapacity && (
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(event.registeredCount / event.maxCapacity) * 100}%` }} />
                      </div>
                   )}
                </div>

                {event.isRegistered ? (
                   <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center space-y-4">
                      <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/50">
                         <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                         <p className="text-sm font-black uppercase italic tracking-tighter">NODE SYNCHRONIZED</p>
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">YOUR IDENTITY IS LINKED TO THIS EVENT</p>
                      </div>
                      <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-500 hover:bg-rose-500/5" onClick={handleCancelRegistration} disabled={registering}>
                         TERMINATE LINK
                      </Button>
                   </div>
                ) : (
                   <Button 
                      className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs transition-all"
                      onClick={handleRegister}
                      disabled={registering || (event.isFull && !event.canRegister)}
                   >
                      {registering ? <RefreshCw className="h-5 w-5 animate-spin" /> : "ESTABLISH LINK"}
                   </Button>
                )}

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center">
                         <ShieldCheck className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">INSTITUTIONAL VERIFICATION REQUIRED FOR ONLINE CLUSTERS</p>
                   </div>
                </div>
             </div>
          </Card>

          {/* ORGANIZER NODE */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-300">Originating Node</h4>
             <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-14 w-14 rounded-2xl shadow-xl border-2 border-white">
                   <AvatarImage src={event.organization.logoUrl || ""} />
                   <AvatarFallback className="bg-slate-900 text-white font-black">{event.organization.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                   <p className="text-sm font-black uppercase italic truncate tracking-tighter">{event.organization.name}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VERIFIED ENTITY</p>
                </div>
             </div>
             <Button variant="outline" className="w-full h-12 rounded-xl border-none bg-slate-50 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px]" onClick={() => router.push(`/organization/${event.organization.slug}`)}>
                VIEW ENTITY MATRIX
             </Button>
          </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Engagement Nodal Intelligence v1.2.4 • Verified Institutional Sync</p>
      </footer>
    </div>
  );
}