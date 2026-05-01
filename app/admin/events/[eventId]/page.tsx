"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Mail,
  Download,
  Eye,
  Zap,
  ShieldCheck,
  ChevronRight,
  Video,
  Globe,
  Trash2,
  ExternalLink,
  CheckCircle2,
  FileText,
  Building2,
  MoreVertical,
  Loader2,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthProfile } from "@/context/AuthContext";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const eventId = params?.eventId as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const organizationId = (profile as any)?.organizationId;

  useEffect(() => {
    if (eventId && organizationId) fetchEvent();
  }, [eventId, organizationId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}?organizationId=${organizationId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Fetching event metrics...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-slate-100 rounded-full">
          <Calendar className="h-12 w-12 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-slate-500 mt-2 max-w-sm">The event you're looking for doesn't exist or has been removed.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl px-8 h-12">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-start gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-xl bg-slate-50 hover:bg-slate-100 border-none transition-all" 
            onClick={() => router.push("/admin/events")}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-orange-500 text-white border-none rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider">
                {event.eventType?.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-500">
                {event.status || 'published'}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{event.title}</h1>
            <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {format(new Date(event.startsAt), 'MMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {format(new Date(event.startsAt), 'p')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            className="h-12 flex-1 lg:flex-none rounded-xl font-bold px-6 border-slate-200 hover:bg-slate-50 transition-all"
            onClick={() => router.push(`/admin/events/edit/${event.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button 
            className="h-12 flex-1 lg:flex-none rounded-xl font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Share2 className="h-4 w-4 mr-2" /> Invite
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Registrants", value: event.registeredCount || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Capacity", value: event.maxCapacity || "Unlimited", icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Check-ins", value: event.checkedInCount || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Revenue", value: event.isPaid ? `${event.currencyCode} ${((event.price || 0) * (event.registeredCount || 0)).toLocaleString()}` : "Free", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-shadow flex items-center gap-5">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit flex gap-1 mb-8">
              <TabsTrigger value="overview" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="roster" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Roster</TabsTrigger>
              <TabsTrigger value="settings" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-10 rounded-[2.5rem] border-none shadow-sm bg-white space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-50">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-amber-50 flex items-center justify-center p-3 border border-amber-100 shadow-inner">
                      <Calendar className="h-10 w-10 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Event Logistics</h3>
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 uppercase text-xs tracking-widest">
                        {event.mode === 'online' ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {event.mode === 'online' ? 'Digital Session' : 'Physical Venue'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location Details</p>
                    <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {event.locationName || 'To Be Announced'}
                    </p>
                    <p className="text-sm font-bold text-slate-400 italic">{event.locationCity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> Description
                    </h4>
                    <div className="text-slate-600 leading-relaxed text-base font-medium whitespace-pre-wrap">
                      {event.description}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="p-8 rounded-3xl bg-blue-50/50 border border-blue-100/50 space-y-6">
                      <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                        <Users className="h-4 w-4" /> Capacity Pulse
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-blue-400">Total Progress</span>
                          <span className="text-blue-900">
                             {event.maxCapacity ? `${Math.round(((event.registeredCount || 0) / event.maxCapacity) * 100)}%` : 'Active'}
                          </span>
                        </div>
                        <Progress value={event.maxCapacity ? ((event.registeredCount || 0) / event.maxCapacity) * 100 : 100} className="h-2 bg-blue-100" />
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                          {event.registeredCount || 0} Registered out of {event.maxCapacity || 'Unlimited'} spots
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Admission
                      </h4>
                      <div className="flex flex-wrap gap-2">
                         <Badge className="bg-slate-50 text-slate-600 border-slate-100 rounded-xl px-4 py-1.5 text-xs font-bold">
                            {event.isPaid ? `Paid: ${event.currencyCode} ${event.price}` : 'Complimentary'}
                         </Badge>
                         <Badge className="bg-slate-50 text-slate-600 border-slate-100 rounded-xl px-4 py-1.5 text-xs font-bold">
                            {event.requiresApproval ? 'Manual Approval' : 'Instant Booking'}
                         </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="roster" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Confirmed Attendees</h3>
                  <Button variant="ghost" className="text-blue-600 font-bold">Download Roster</Button>
                </div>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Attendee</TableHead>
                      <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Engagement</TableHead>
                      <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Check-In</TableHead>
                      <TableHead className="px-8 py-5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.attendees?.length > 0 ? (
                      event.attendees.map((attendee: any) => (
                        <TableRow key={attendee.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 rounded-xl border border-white shadow-sm">
                                <AvatarImage src={attendee.avatarUrl} />
                                <AvatarFallback className="bg-blue-600 text-white font-bold">{attendee.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{attendee.name}</p>
                                <p className="text-[11px] font-medium text-slate-400">{attendee.email || 'Alumni Member'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge className="bg-blue-50 text-blue-600 border-none rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                               Confirmed
                             </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                             {attendee.checkedIn ? (
                               <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                 <span className="text-[11px] font-bold text-emerald-700">Checked In</span>
                               </div>
                             ) : (
                               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Pending</span>
                             )}
                          </TableCell>
                          <TableCell className="px-8 text-right">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center text-slate-400 font-medium italic">
                          No registrations recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white space-y-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Administration</h4>
            <div className="space-y-2">
              {[
                { label: "Email Blast", icon: Mail, sub: "Message All Attendees", color: "blue" },
                { label: "Attendance CSV", icon: Download, sub: "Export Registry", color: "indigo" },
                { label: "Live View", icon: ExternalLink, sub: "Public Facing Page", color: "amber" },
              ].map((action, i) => (
                <button 
                  key={i} 
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 leading-none">{action.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{action.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-10 rounded-[2.5rem] border-none bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/10 blur-[80px] rounded-full translate-x-12 -translate-y-12"></div>
            <div className="relative z-10 space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                <Trash2 className="h-7 w-7 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Cancel Event</h4>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Cancelling an event will notify all registered members and close the registration portal permanently.
                </p>
              </div>
              <Button variant="ghost" className="w-full h-12 rounded-xl border border-white/10 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
                Terminate Event
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}