"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, Clock, MapPin, Users, Share2, Bookmark, ArrowLeft, Loader2, 
  Link as LinkIcon, CheckCircle2, Info, Video, Building2, Globe, Ticket, 
  DollarSign, Zap, RefreshCw, ShieldCheck, User 
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const eventId = params.eventId as string;
  const slug = organization?.slug || "default";

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!profile) {
      toast.error("Please sign in to register");
      return;
    }

    if (!event?.canRegister) {
      toast.error("Registration is not available for this event");
      return;
    }

    try {
      setRegistering(true);
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.registration?.isWaitlisted) {
          toast.success("Added to waitlist");
        } else if (data.registration?.requiresApproval) {
          toast.success("Registration pending approval");
        } else {
          toast.success("Successfully registered!");
        }
        fetchEvent();
      } else {
        toast.error(data.error || "Failed to register");
      }
    } catch (err) {
      toast.error("Failed to submit registration");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm("Are you sure you want to cancel your registration?")) return;

    try {
      setRegistering(true);
      const res = await fetch(`/api/events/${event?.id}/register`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Registration cancelled");
        fetchEvent();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel registration");
      }
    } catch (err) {
      toast.error("Failed to cancel registration");
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-8 w-64 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <Skeleton className="h-[440px] w-full rounded-[3rem]" />
            <Skeleton className="h-80 w-full rounded-[3rem]" />
          </div>
          <div className="space-y-10">
            <Skeleton className="h-96 w-full rounded-[3rem]" />
            <Skeleton className="h-48 w-full rounded-[2.5rem]" />
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-slate-900">Event Not Found</h1>
            <p className="text-sm font-medium text-slate-400">The event you're looking for doesn't exist or has been removed.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => router.push(`/organization/${slug}/dashboard/events`)}>
            Back to Events
         </Button>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-all border border-slate-100" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 text-slate-400" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <Badge variant="outline" className="text-[10px] font-bold uppercase text-blue-600 border-blue-100 bg-blue-50/50">{event.eventType.replace('_', ' ')}</Badge>
                 <Badge variant="outline" className="text-[10px] font-bold uppercase text-slate-500 border-slate-200 bg-slate-50">{event.mode.replace('_', ' ')}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
           </div>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 border-slate-100" onClick={handleShare}>
              <Share2 className="h-5 w-5 text-slate-400" />
           </Button>
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 border-slate-100" onClick={() => setIsBookmarked(!isBookmarked)}>
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "text-blue-600 fill-current" : "text-slate-400"}`} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Banner */}
          <div className="relative h-[440px] rounded-[3rem] overflow-hidden shadow-sm group">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} className="w-full h-full object-cover transition-transform duration-1000" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 flex flex-wrap gap-4">
               <div className="px-6 py-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/20">
                  <Calendar className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{format(startDate, "MMM dd, yyyy")}</span>
               </div>
               <div className="px-6 py-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/20">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
               </div>
               <div className="px-6 py-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/20">
                  <MapPin className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{event.locationCity || "Global"}</span>
               </div>
            </div>
          </div>

          {/* Description */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white border border-slate-50 overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-slate-50">
               <CardTitle className="text-xl font-bold text-slate-900">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="p-10">
               <div className="prose prose-slate max-w-none">
                  {event.descriptionHtml ? (
                     <div dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} className="text-slate-600 font-medium leading-relaxed" />
                  ) : (
                     <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {event.description || "No description provided for this event."}
                     </p>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Speakers */}
          {event.speakers?.length > 0 && (
            <div className="space-y-6">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] ml-6 text-slate-400">Featured Speakers</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.speakers.map((speaker) => (
                    <Card key={speaker.id} className="border-none shadow-sm rounded-[2.5rem] bg-white border border-slate-50 overflow-hidden p-6 hover:shadow-md transition-all">
                       <div className="flex gap-5">
                          <Avatar className="h-20 w-20 rounded-2xl border-2 border-slate-50 shadow-sm">
                             <AvatarImage src={speaker.avatarUrl || ""} className="object-cover" />
                             <AvatarFallback className="bg-slate-100 text-slate-900 font-bold">{speaker.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 py-1 space-y-1">
                             <h4 className="text-base font-bold text-slate-900 truncate">{speaker.name}</h4>
                             <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate">{speaker.title || "Speaker"}</p>
                             <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-slate-300" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{speaker.company || "Independent"}</p>
                             </div>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Registration Card */}
          <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white p-8 sticky top-24">
             <div className="space-y-8">
                <div className="flex justify-between items-center bg-white/10 p-5 rounded-3xl">
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</p>
                      <p className="text-2xl font-bold mt-1">{event.isPaid ? `${event.price} ${event.currencyCode}` : "Free Admission"}</p>
                   </div>
                   <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-blue-400" />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest px-1">
                      <span className="text-slate-400">Attendance</span>
                      <span>{event.registeredCount} / {event.maxCapacity || '∞'} Registered</span>
                   </div>
                   {event.maxCapacity && (
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(event.registeredCount / event.maxCapacity) * 100}%` }} />
                      </div>
                   )}
                </div>

                {event.isRegistered ? (
                   <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center space-y-4">
                      <div className="h-14 w-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                         <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div>
                         <p className="text-lg font-bold">You're Registered!</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {event.userRegistration?.status.toUpperCase()}</p>
                      </div>
                      <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-300 hover:bg-white/5" onClick={handleCancelRegistration} disabled={registering}>
                         Cancel Registration
                      </Button>
                   </div>
                ) : (
                   <Button 
                      className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02]"
                      onClick={handleRegister}
                      disabled={registering || (event.isFull && !event.canRegister)}
                   >
                      {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register Now"}
                   </Button>
                )}

                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                   <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Secure registration via institution portal</p>
                </div>
             </div>
          </Card>

          {/* Organizer */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white border border-slate-50 p-8">
             <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-slate-300">Host Institution</h4>
             <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-14 w-14 rounded-2xl shadow-sm border border-slate-100">
                   <AvatarImage src={event.organization.logoUrl || ""} className="object-contain p-2" />
                   <AvatarFallback className="bg-slate-900 text-white font-bold">{event.organization.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                   <p className="text-sm font-bold text-slate-900 truncate">{event.organization.name}</p>
                   <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Verified Host</p>
                </div>
             </div>
             <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 hover:bg-slate-100 font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push(`/organization/${event.organization.slug}`)}>
                View Profile
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}