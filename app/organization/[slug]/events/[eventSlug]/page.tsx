"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, Clock, MapPin, Share2, Bookmark, ArrowLeft, Loader2, 
  Info, Building2, Ticket, CheckCircle2, ShieldCheck, Users
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuthProfile();
  const eventSlug = params.eventSlug as string;
  const orgSlug = params.slug as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (eventSlug) {
      fetchEvent();
    }
  }, [eventSlug]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventSlug}`);
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
      router.push(`/sign-in?redirect=/organization/${orgSlug}/events/${eventSlug}`);
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
        toast.success("Successfully registered!");
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

  if (loading || profileLoading) {
    return <div className="container py-8 max-w-7xl mx-auto px-6"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!event) {
    return (
      <div className="container py-24 text-center space-y-8 max-w-sm mx-auto">
         <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <Info className="h-8 w-8 text-rose-500" />
         </div>
         <h1 className="text-2xl font-bold">Event Not Found</h1>
         <Button onClick={() => router.push(`/organization/${orgSlug}`)}>Back to Organization</Button>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100" onClick={() => router.push(`/organization/${orgSlug}`)}>
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
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-100" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied");
          }}>
              <Share2 className="h-5 w-5 text-slate-400" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Banner */}
          <div className="relative h-[440px] rounded-[3rem] overflow-hidden shadow-sm">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} className="w-full h-full object-cover" alt={event.title} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 flex flex-wrap gap-4">
              <div className="px-6 py-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/20">
                <Calendar className="h-4 w-4 text-white" />
                <span className="text-xs font-bold text-white uppercase">{format(startDate, "MMM dd, yyyy")}</span>
              </div>
              <div className="px-6 py-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/20">
                <MapPin className="h-4 w-4 text-white" />
                <span className="text-xs font-bold text-white uppercase">{event.locationCity || "Global"}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white">
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-xl font-bold">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <div className="prose prose-slate max-w-none text-slate-600">
                {event.description || "No description provided."}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          {/* Registration Card */}
          <Card className="border-none shadow-xl rounded-[3rem] bg-slate-900 text-white p-8">
            <div className="space-y-8">
              <div className="bg-white/10 p-5 rounded-3xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Admission</p>
                <p className="text-2xl font-bold mt-1">{event.isPaid ? `${event.price} ${event.currencyCode}` : "Free Admission"}</p>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase px-1">
                    <span className="text-slate-400">Capacity</span>
                    <span>{event.registeredCount} / {event.maxCapacity || '∞'}</span>
                 </div>
                 {event.maxCapacity && (
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(event.registeredCount / event.maxCapacity) * 100}%` }} />
                    </div>
                 )}
              </div>

              {event.userRegistration ? (
                <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold">You're Registered!</p>
                </div>
              ) : (
                <Button 
                  className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs"
                  onClick={handleRegister}
                  disabled={registering || event.isFull}
                >
                  {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register Now"}
                </Button>
              )}
            </div>
          </Card>

          {/* Organizer */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
             <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6 text-slate-400">Organizer</h4>
             <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-14 w-14 rounded-2xl border border-slate-100">
                   <AvatarImage src={event.organization.logoUrl || ""} className="object-contain p-2" />
                   <AvatarFallback>{event.organization.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                   <p className="text-sm font-bold truncate">{event.organization.name}</p>
                   <p className="text-[9px] font-bold text-blue-600 uppercase">Verified</p>
                </div>
             </div>
             <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push(`/organization/${event.organization.slug}`)}>
                View Profile
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
