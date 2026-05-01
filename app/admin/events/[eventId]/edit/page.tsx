"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Zap,
  Loader2,
  CheckCircle2,
  FileText,
  Save,
  Trash2,
  Plus,
  Video,
  ShieldCheck,
  ImageIcon,
  Globe,
  Info,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { EventType, EventMode } from "@/lib/generated/prisma";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const eventId = params?.eventId as string;
  const organizationId = (profile as any)?.organizationId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    eventType: "networking" as EventType,
    mode: "in_person" as EventMode,
    startsAt: "",
    endsAt: "",
    locationName: "",
    locationAddress: "",
    locationCity: "",
    locationCountry: "US",
    maxCapacity: "",
    isPaid: false,
    price: "",
    currencyCode: "USD",
  });

  useEffect(() => {
    if (eventId && organizationId) {
      fetchEvent();
    }
  }, [eventId, organizationId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}?organizationId=${organizationId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      const data = await res.json();
      const event = data.event;
      
      setFormData({
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        mode: event.mode,
        startsAt: event.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : "",
        endsAt: event.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : "",
        locationName: event.locationName || "",
        locationAddress: event.locationAddress || "",
        locationCity: event.locationCity || "",
        locationCountry: event.locationCountry || "US",
        maxCapacity: event.maxCapacity?.toString() || "",
        isPaid: event.isPaid || false,
        price: event.price?.toString() || "",
        currencyCode: event.currencyCode || "USD",
      });
    } catch (err) {
      toast.error("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.isPaid && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error("Please enter a valid price for a paid event.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        toast.success("Event updated successfully");
        router.push(`/admin/events/${eventId}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update event");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-xl bg-slate-50 hover:bg-slate-100 border-none transition-all" 
            onClick={() => router.push(`/admin/events/${eventId}`)}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Event</h1>
            <p className="text-slate-500 font-medium text-sm">Refine the details of your community gathering.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            className="h-12 rounded-xl font-bold text-rose-500 hover:bg-rose-50 px-6 transition-all"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Cancel Event
          </Button>
          <Button 
            form="edit-event-form"
            disabled={saving}
            className="h-12 rounded-xl font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <form id="edit-event-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Core Information</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-bold text-slate-700 ml-1">Event Title *</Label>
                  <Input 
                    id="title"
                    placeholder="Event title" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-lg focus:ring-blue-500/10 transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold text-slate-700 ml-1">Detailed Description *</Label>
                  <Textarea 
                    id="description"
                    placeholder="Provide event details..." 
                    className="min-h-[200px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 font-medium text-slate-600 focus:ring-blue-500/10 transition-all leading-relaxed"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Category</Label>
                <Select value={formData.eventType} onValueChange={(v) => setFormData({...formData, eventType: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="career_fair">Career Fair</SelectItem>
                    <SelectItem value="social">Social Gathering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Mode of Attendance</Label>
                <Select value={formData.mode} onValueChange={(v) => setFormData({...formData, mode: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="in_person">Physical (In-Person)</SelectItem>
                    <SelectItem value="online">Digital (Virtual)</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-8">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Venue & Accessibility</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Venue / Platform Name</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Venue or platform" 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-11 font-bold text-slate-700"
                    value={formData.locationName}
                    onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="City" 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-11 font-bold text-slate-700"
                    value={formData.locationCity}
                    onChange={(e) => setFormData({...formData, locationCity: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Address or Meeting Link</Label>
              <div className="relative">
                <Info className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Address or link" 
                  className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-11 font-bold text-slate-700"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({...formData, locationAddress: e.target.value})}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Timeline</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Event Begins
                </Label>
                <Input 
                  type="datetime-local" 
                  className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Event Concludes
                </Label>
                <Input 
                  type="datetime-local" 
                  className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({...formData, endsAt: e.target.value})}
                  required
                />
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Admission & Billing</h4>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 transition-all">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Paid Entry</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Enable Ticketing</p>
                </div>
                <Switch 
                  checked={formData.isPaid}
                  onCheckedChange={(c) => setFormData({...formData, isPaid: c})}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {formData.isPaid && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Currency</Label>
                    <Select value={formData.currencyCode} onValueChange={(v) => setFormData({...formData, currencyCode: v})}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Entry Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-8 font-bold"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 ml-1">Maximum Attendance</Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    type="number" 
                    placeholder="Max capacity" 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-11 font-bold text-slate-700"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}