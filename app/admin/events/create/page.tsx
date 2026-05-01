"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  DollarSign,
  Zap,
  Loader2,
  FileText,
  Video,
  ShieldCheck,
  Globe,
  Info,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { EventType, EventMode } from "@/lib/generated/prisma";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CreateEventPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    eventType: "networking" as EventType,
    mode: "in_person" as EventMode,
    startDate: undefined as Date | undefined,
    startTime: "09:00",
    endDate: undefined as Date | undefined,
    endTime: "10:00",
    locationName: "",
    locationAddress: "",
    locationCity: "",
    locationCountry: "US",
    maxCapacity: "",
    isPaid: false,
    price: "",
    currencyCode: "USD",
    bannerUrl: "",
    isFeatured: false,
    requiresApproval: false,
  });

  const organizationId = (profile as any)?.organizationId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization not found.");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select a start date.");
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const startsAt = new Date(formData.startDate);
      const [sHours, sMins] = formData.startTime.split(":");
      startsAt.setHours(parseInt(sHours), parseInt(sMins));

      let endsAt = null;
      if (formData.endDate) {
        endsAt = new Date(formData.endDate);
        const [eHours, eMins] = formData.endTime.split(":");
        endsAt.setHours(parseInt(eHours), parseInt(eMins));
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
          maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt ? endsAt.toISOString() : null,
        }),
      });

      if (res.ok) {
        toast.success("Event created successfully");
        router.push("/admin/events");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create event");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100"
            onClick={() => router.push("/admin/events")}
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Event</h1>
            <p className="text-xs text-slate-500">Plan and schedule a new community event.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            className="h-9 rounded-xl text-slate-500 font-semibold text-xs px-4"
            onClick={() => router.push("/admin/events")}
          >
            Cancel
          </Button>
          <Button
            form="create-event-form"
            disabled={loading}
            className="h-9 rounded-xl font-bold px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-3.5 w-3.5 mr-2 fill-current" />}
            Publish Event
          </Button>
        </div>
      </div>

      <form id="create-event-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Event Details
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-600 ml-1">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Annual Alumni Meet 2024"
                  className="h-10 rounded-xl border-slate-200 text-sm font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-600 ml-1">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your community what this event is about..."
                  className="min-h-[120px] rounded-xl border-slate-200 p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 ml-1">Category</Label>
                  <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="career_fair">Career Fair</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 ml-1">Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => setFormData({ ...formData, mode: v })}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In-Person</SelectItem>
                      <SelectItem value="online">Virtual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Venue & Location
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 ml-1">Venue Name</Label>
                  <Input
                    placeholder="e.g. Main Auditorium or Zoom Link"
                    className="h-10 rounded-xl border-slate-200 text-sm font-medium"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 ml-1">City</Label>
                  <Input
                    placeholder="e.g. New York"
                    className="h-10 rounded-xl border-slate-200 text-sm font-medium"
                    value={formData.locationCity}
                    onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 ml-1">Address / Link</Label>
                <Input
                  placeholder="Full address or meeting URL"
                  className="h-10 rounded-xl border-slate-200 text-sm font-medium"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Schedule
              </p>
            </div>
            <CardContent className="p-5 space-y-5">
              {/* Start Date & Time */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Starts At</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 rounded-xl border-slate-200 text-sm",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="time"
                      className="pl-9 h-10 rounded-xl border-slate-200 text-sm font-medium"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ends At</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 rounded-xl border-slate-200 text-sm",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="time"
                      className="pl-9 h-10 rounded-xl border-slate-200 text-sm font-medium"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Admission
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 transition-all">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Paid Event</p>
                  <p className="text-[10px] text-slate-400 font-medium">Ticketing enabled</p>
                </div>
                <Switch
                  checked={formData.isPaid}
                  onCheckedChange={(c) => setFormData({ ...formData, isPaid: c })}
                />
              </div>

              {formData.isPaid && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs font-semibold text-slate-600 ml-1">Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-8 h-10 rounded-xl border-slate-200 text-sm font-medium"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 ml-1">Capacity</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    className="pl-8 h-10 rounded-xl border-slate-200 text-sm font-medium"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8"></div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Note</h4>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed font-medium">
                Publishing will notify institutional members. Review all details before proceeding.
              </p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}