"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Bookmark, 
  ArrowLeft, 
  Ticket, 
  RefreshCw,
  Info,
  CheckCircle2
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const eventId = params.eventId as string;
  const slug = organization?.slug || "default";

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

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
    if (!profile) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/dashboard/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      if (res.ok) {
        toast.success("Successfully registered!");
        fetchEvent();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Registration failed");
    } finally {
      setRegistering(false);
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
      <div className="container py-24 text-center max-w-sm mx-auto space-y-6">
         <Info className="h-12 w-12 text-slate-200 mx-auto" />
         <h1 className="text-xl font-bold">Event Not Found</h1>
         <p className="text-sm text-slate-500">This event might have been cancelled or moved.</p>
         <Button className="w-full" onClick={() => router.push(`/organization/${slug}/dashboard/events`)}>
            Back to Calendar
         </Button>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="uppercase tracking-wider">{event.eventType?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{event.mode}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">{event.title}</h1>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
           }}>
              <Share2 className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Banner */}
          <div className="aspect-video relative rounded-lg overflow-hidden border bg-slate-100">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Calendar className="h-12 w-12" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
               <Badge className="bg-white/90 text-slate-900 shadow-sm border-none">{format(startDate, "MMM dd, yyyy")}</Badge>
               <Badge className="bg-white/90 text-slate-900 shadow-sm border-none">{format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}</Badge>
               <Badge className="bg-white/90 text-slate-900 shadow-sm border-none">{event.locationCity || "Online"}</Badge>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
               <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                  {event.descriptionHtml ? (
                     <div dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} />
                  ) : (
                     <p>{event.description || "No description provided."}</p>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Speakers */}
          {event.speakers?.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-900">Speakers</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.speakers.map((speaker: any) => (
                    <Card key={speaker.id} className="p-4">
                       <div className="flex gap-4">
                          <Avatar className="h-12 w-12 border">
                             <AvatarImage src={speaker.avatarUrl || ""} />
                             <AvatarFallback>{speaker.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                             <h4 className="font-bold text-sm truncate">{speaker.name}</h4>
                             <p className="text-xs text-indigo-600 font-medium truncate">{speaker.title}</p>
                             <p className="text-xs text-slate-400 truncate">{speaker.company}</p>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <Card className="bg-slate-900 text-white">
              <CardContent className="p-6 space-y-6">
                 <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Ticket Price</p>
                       <p className="text-xl font-bold">{event.isPaid ? `${event.price} ${event.currencyCode}` : "Free Admission"}</p>
                    </div>
                    <Ticket className="h-6 w-6 text-slate-400" />
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-400">Attendance</span>
                       <span>{event.registeredCount} / {event.maxCapacity || 'Unlimited'}</span>
                    </div>
                    {event.maxCapacity && (
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(event.registeredCount / event.maxCapacity) * 100}%` }} />
                       </div>
                    )}
                 </div>

                 {event.isRegistered ? (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center space-y-3">
                       <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                       <p className="font-bold">You're Registered</p>
                       <Button variant="ghost" size="sm" className="w-full text-xs text-rose-400 hover:text-rose-500 hover:bg-rose-500/5">
                          Cancel Registration
                       </Button>
                    </div>
                 ) : (
                    <Button 
                       className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                       onClick={handleRegister}
                       disabled={registering || (event.isFull)}
                    >
                       {registering ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Register Now"}
                    </Button>
                 )}
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="text-xs font-bold uppercase text-slate-400">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                       <AvatarImage src={event.organization.logoUrl || ""} />
                       <AvatarFallback>{event.organization.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                       <p className="font-bold text-sm truncate">{event.organization.name}</p>
                       <p className="text-[10px] text-slate-500 font-semibold uppercase">Verified Entity</p>
                    </div>
                 </div>
                 <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => router.push(`/organization/${event.organization.slug}`)}>
                    View Organization
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}