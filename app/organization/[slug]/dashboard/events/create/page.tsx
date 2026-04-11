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
import { ArrowLeft, Calendar, Clock, MapPin, Save, RefreshCw } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

export default function CreateEventPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = organization?.slug || "default";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "networking",
    mode: "in_person",
    locationName: "",
    locationCity: "",
    locationCountry: "",
    meetingLink: "",
    date: "",
    startTime: "",
    endTime: "",
    maxCapacity: "",
    isPaid: false,
    price: "",
    currencyCode: "USD",
    bannerUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organizationId) {
      toast.error("Organization ID missing");
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
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
        locationCity: formData.mode === "online" ? null : formData.locationCity,
        locationCountry: formData.mode === "online" ? null : formData.locationCountry,
        meetingLink: formData.mode === "online" ? formData.meetingLink : null,
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : null,
        currencyCode: formData.isPaid ? formData.currencyCode : "USD",
        bannerUrl: formData.bannerUrl || null,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create event");

      const data = await res.json();
      toast.success("Event created successfully!");
      router.push(`/organization/${slug}/dashboard/events/${data.event.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (profileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Create Event</h1>
           <p className="text-slate-500 mt-1">Organize a new event for your institutional community.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
               <CardTitle>Basic Information</CardTitle>
               <CardDescription>Enter the core details for your event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. Annual Alumni Meetup 2024"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What is this event about?"
                  className="min-h-[140px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(v) => handleInputChange("eventType", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Engagement Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => handleInputChange("mode", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in_person">In-Person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle>Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.mode !== "online" && (
            <Card>
               <CardHeader>
                  <CardTitle>Location</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                     <Label>Venue Name</Label>
                     <Input
                        placeholder="e.g. Central Library Hall"
                        value={formData.locationName}
                        onChange={(e) => handleInputChange("locationName", e.target.value)}
                        required
                     />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                           placeholder="City"
                           value={formData.locationCity}
                           onChange={(e) => handleInputChange("locationCity", e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                           placeholder="Country"
                           value={formData.locationCountry}
                           onChange={(e) => handleInputChange("locationCountry", e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
          )}

          {formData.mode === "online" && (
             <Card>
                <CardHeader>
                   <CardTitle>Meeting Details</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                      <Label>Meeting Link</Label>
                      <Input
                         placeholder="https://zoom.us/..."
                         value={formData.meetingLink}
                         onChange={(e) => handleInputChange("meetingLink", e.target.value)}
                      />
                   </div>
                </CardContent>
             </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900 text-white">
             <CardHeader>
                <CardTitle>Publishing</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-slate-400">Capacity Limit (Optional)</Label>
                   <Input 
                      type="number"
                      placeholder="Unlimited"
                      className="bg-white/10 border-white/20 text-white"
                      value={formData.maxCapacity}
                      onChange={(e) => handleInputChange("maxCapacity", e.target.value)}
                   />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                   <div>
                      <p className="text-sm font-semibold">Paid Event</p>
                      <p className="text-xs text-slate-500">Enable ticket pricing.</p>
                   </div>
                   <Switch 
                      checked={formData.isPaid}
                      onCheckedChange={(v) => handleInputChange("isPaid", v)}
                   />
                </div>

                {formData.isPaid && (
                   <div className="grid grid-cols-2 gap-4">
                      <Input 
                         type="number"
                         placeholder="0.00"
                         className="bg-white/10 border-white/20 text-white"
                         value={formData.price}
                         onChange={(e) => handleInputChange("price", e.target.value)}
                      />
                      <Select value={formData.currencyCode} onValueChange={(v) => handleInputChange("currencyCode", v)}>
                         <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                )}

                <div className="pt-4 space-y-3">
                   <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                      {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Publish Event
                   </Button>
                   <Button type="button" variant="ghost" className="w-full text-slate-400 hover:text-white" onClick={() => router.back()}>
                      Cancel
                   </Button>
                </div>
             </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle className="text-xs font-bold uppercase text-slate-400">Visuals</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                   <Label>Banner Image URL</Label>
                   <Input 
                      placeholder="https://..."
                      value={formData.bannerUrl}
                      onChange={(e) => handleInputChange("bannerUrl", e.target.value)}
                   />
                </div>
             </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}