"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "general",
    start_date: "",
    end_date: "",
    location: "",
    max_attendees: "",
    registration_deadline: "",
    status: "draft",
  });

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      try {
        const orgsRes = await fetch("/api/organizations");
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          if (orgsData.organizations && orgsData.organizations.length > 0) {
            setOrganizationId(orgsData.organizations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load organization:", err);
      }
    }
    loadOrg();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    if (!formData.title || !formData.start_date) {
      toast.error("Title and start date are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create event");
      }

      toast.success("Event created successfully!");
      router.push("/admin/events");
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Create Event</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new event to the calendar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Fill in the information for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Annual Alumni Reunion 2024"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="reunion">Reunion</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="career">Career Fair</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="University Main Campus"
                />
              </div>

              <div>
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  placeholder="300"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="registration_deadline">Registration Deadline</Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

