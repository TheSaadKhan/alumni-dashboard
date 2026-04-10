"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Loader2, Video, Building2, Globe, DollarSign, Lock, Eye, Save, Plus, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface FormData {
  title: string;
  description: string;
  eventType: string;
  mode: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  locationCountry: string;
  meetingLink: string;
  meetingPassword: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  maxCapacity: string;
  isPaid: boolean;
  price: string;
  currencyCode: string;
  bannerUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  requiresApproval: boolean;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useAuthProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    eventType: "social",
    mode: "in_person",
    locationName: "",
    locationAddress: "",
    locationCity: "",
    locationCountry: "",
    meetingLink: "",
    meetingPassword: "",
    date: "",
    startTime: "",
    endTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxCapacity: "",
    isPaid: false,
    price: "",
    currencyCode: "USD",
    bannerUrl: "",
    thumbnailUrl: "",
    isFeatured: false,
    requiresApproval: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organizationId) {
      toast.error("Institutional node not found");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Event identifier required");
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Temporal coordinates required");
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    if (endDateTime <= startDateTime) {
      toast.error("End cycle must follow start cycle");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        organizationId: profile.organizationId,
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        mode: formData.mode,
        locationName: formData.mode === "online" ? null : formData.locationName,
        locationAddress: formData.mode === "online" ? null : formData.locationAddress,
        locationCity: formData.mode === "online" ? null : formData.locationCity,
        locationCountry: formData.mode === "online" ? null : formData.locationCountry,
        meetingLink: formData.mode === "online" ? formData.meetingLink : null,
        meetingPassword: formData.mode === "online" ? formData.meetingPassword : null,
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        timezone: formData.timezone,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : null,
        currencyCode: formData.isPaid ? formData.currencyCode : null,
        bannerUrl: formData.bannerUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        isFeatured: formData.isFeatured,
        requiresApproval: formData.requiresApproval,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize event node");

      toast.success("Event cycle published");
      router.push(`/dashboard/events/${data.event.slug || data.event.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to publish engagement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (profileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!profile?.organizationId) {
    return (
      <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
         <ShieldCheck className="h-12 w-12 text-slate-100 mx-auto" />
         <div className="space-y-2">
            <h1 className="text-xl font-bold italic uppercase tracking-tighter">Identity Restricted</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">Deployment of engagement nodes requires an active institutional affiliation.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/onboarding")}>
            Complete Verification
         </Button>
      </div>
    );
  }

  const timezones = Intl.supportedValuesOf("timeZone");

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Interface Header */}
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Button>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Engagement Hub</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Node Orchestration</span>
           </div>
           <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Initialize Institutional Event</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* CORE IDENTITY */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-6 md:p-10">
            <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Core Identity</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Essential engagement identifiers.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Event Identifier (Title)</Label>
                <Input
                  placeholder="E.G. GLOBAL ALUMNI SUMMIT 2024"
                  className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Engagement Narrative</Label>
                <Textarea
                  placeholder="DESCRIBE THE CORE VALUE PROPOSITION..."
                  className="rounded-[2rem] border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest min-h-[140px] p-6 resize-none"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Protocol Classification</Label>
                  <Select value={formData.eventType} onValueChange={(v) => handleInputChange("eventType", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="webinar" className="text-[10px] font-black uppercase tracking-widest">WEBINAR STREAM</SelectItem>
                      <SelectItem value="workshop" className="text-[10px] font-black uppercase tracking-widest">SKILL WORKSHOP</SelectItem>
                      <SelectItem value="networking" className="text-[10px] font-black uppercase tracking-widest">NETWORKING FORUM</SelectItem>
                      <SelectItem value="social" className="text-[10px] font-black uppercase tracking-widest">INSTITUTIONAL SOCIAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Engagement Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => handleInputChange("mode", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="online" className="text-[10px] font-black uppercase tracking-widest">VIRTUAL RELAY</SelectItem>
                      <SelectItem value="in_person" className="text-[10px] font-black uppercase tracking-widest">ON-SITE PRESENCE</SelectItem>
                      <SelectItem value="hybrid" className="text-[10px] font-black uppercase tracking-widest">HYBRID SYNC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TEMPORAL COORDINATES */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-6 md:p-10">
            <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
               </div>
               <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Temporal Core</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specify synchronisation periods.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Target Date</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Start Cycle</Label>
                  <Input
                    type="time"
                    className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">End Cycle</Label>
                  <Input
                    type="time"
                    className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Timezone Protocol</Label>
                <Select value={formData.timezone} onValueChange={(v) => handleInputChange("timezone", v)}>
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-2xl border-none shadow-2xl">
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-[10px] font-black uppercase tracking-widest">{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* LOCATION SPECIFICATIONS */}
          {(formData.mode !== "online") && (
            <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-6 md:p-10">
               <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                     <MapPin className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                     <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Physical Radius</CardTitle>
                     <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Define the on-site deployment zone.</CardDescription>
                  </div>
               </CardHeader>
               <CardContent className="px-0 space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Venue Identifier</Label>
                     <Input
                        placeholder="E.G. MAIN CAMPUS AUDITORIUM"
                        className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                        value={formData.locationName}
                        onChange={(e) => handleInputChange("locationName", e.target.value)}
                        required={formData.mode === "in_person"}
                     />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">City Node</Label>
                        <Input
                           placeholder="CITY"
                           className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                           value={formData.locationCity}
                           onChange={(e) => handleInputChange("locationCity", e.target.value)}
                        />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Country Segment</Label>
                        <Input
                           placeholder="COUNTRY"
                           className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                           value={formData.locationCountry}
                           onChange={(e) => handleInputChange("locationCountry", e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          {/* ORCHESTRATION CONTROL */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                   <Zap className="h-5 w-5" />
                </div>
                <p className="text-base font-black uppercase italic tracking-tighter">Orchestration</p>
             </div>
             <div className="space-y-6">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic text-white/50">Capacity Ceiling</Label>
                   <Input 
                      type="number"
                      placeholder="UNLIMITED"
                      className="h-14 rounded-2xl border-none bg-white/10 text-white placeholder:text-slate-600 font-bold uppercase tracking-widest"
                      value={formData.maxCapacity}
                      onChange={(e) => handleInputChange("maxCapacity", e.target.value)}
                   />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                   <div>
                      <p className="text-[10px] font-black uppercase italic">Paid Asset</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ACCESS FEE REQUIRED</p>
                   </div>
                   <Switch 
                      checked={formData.isPaid}
                      onCheckedChange={(v) => handleInputChange("isPaid", v)}
                      className="data-[state=checked]:bg-blue-500"
                   />
                </div>

                {formData.isPaid && (
                   <div className="grid grid-cols-2 gap-4">
                      <Input 
                         type="number"
                         placeholder="0.00"
                         className="h-12 rounded-xl border-none bg-white/10 text-white font-bold"
                         value={formData.price}
                         onChange={(e) => handleInputChange("price", e.target.value)}
                      />
                      <Select value={formData.currencyCode} onValueChange={(v) => handleInputChange("currencyCode", v)}>
                         <SelectTrigger className="h-12 rounded-xl border-none bg-white/10 text-white font-bold text-[10px]">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="USD" className="text-[10px] font-black uppercase">USD ($)</SelectItem>
                            <SelectItem value="EUR" className="text-[10px] font-black uppercase">EUR (€)</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                )}

                <div className="pt-6 space-y-3">
                   <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs transition-all">
                      {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      PUBLISH NODE
                   </Button>
                   <Button type="button" variant="ghost" className="w-full h-14 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white" onClick={() => router.back()}>
                      ABORT SYNC
                   </Button>
                </div>
             </div>
          </Card>

          {/* MEDIA ASSETS */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-300 border-b border-slate-50 pb-4">Visual Identity</h4>
             <div className="space-y-6">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Banner Relay URL</Label>
                   <Input 
                      placeholder="HTTPS://..."
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm text-[10px] font-bold"
                      value={formData.bannerUrl}
                      onChange={(e) => handleInputChange("bannerUrl", e.target.value)}
                   />
                </div>
             </div>
          </Card>
        </div>
      </form>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Engagement Orchestration Engine v1.2.0 • Institutional Calendar</p>
      </footer>
    </div>
  );
}