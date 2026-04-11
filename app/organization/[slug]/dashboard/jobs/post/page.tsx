"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Briefcase, MapPin, DollarSign, Clock, RefreshCw } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PostJobPage() {
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = organization?.slug || "default";

  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.userType !== "alumni" && profile.userType !== "admin" && profile.userType !== "super_admin") {
        router.push(`/organization/${slug}/dashboard/jobs`);
        toast.error("Access Restricted: Only alumni and admins can post jobs.");
      }
    }
  }, [profile, profileLoading, router, slug]);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "full-time",
    salary: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    applicationDeadline: "",
    remote: false,
    contactEmail: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organizationId) {
      toast.error("Organization ID missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        organizationId: profile.organizationId,
        title: formData.title,
        companyName: formData.company,
        locationCity: formData.location,
        jobType: formData.type?.replace("-", "_") || "full_time",
        description: formData.description + (formData.responsibilities ? `\n\nResponsibilities:\n${formData.responsibilities}` : ""),
        requirements: formData.requirements.split('\n').filter(s => s.trim().length > 0),
        benefits: formData.benefits.split('\n').filter(s => s.trim().length > 0),
        expiresAt: formData.applicationDeadline || null,
        isRemote: formData.remote,
        remoteType: formData.remote ? "fully_remote" : "on_site",
        applicationEmail: formData.contactEmail || null,
        applicationMethod: "email",
        status: "active"
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to post job");

      toast.success("Job posted successfully!");
      router.push(`/organization/${slug}/dashboard/jobs`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
           <h1 className="text-3xl font-bold text-slate-900">Post Opportunity</h1>
           <p className="text-slate-500 mt-1">Share a job or internship with your institutional network.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
               <CardTitle>Job Details</CardTitle>
               <CardDescription>Provide the core information about the role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company / Organization</Label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Salary Range (Optional)</Label>
                  <Input
                    placeholder="e.g. $80k - $100k"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
                 <div>
                    <p className="text-sm font-semibold">Remote Friendly</p>
                    <p className="text-xs text-slate-500">Allow applicants to work from anywhere.</p>
                 </div>
                 <Switch
                    checked={formData.remote}
                    onCheckedChange={(checked) => setFormData({ ...formData, remote: checked })}
                 />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle>Description & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Role Summary</Label>
                <Textarea
                  placeholder="Describe the overall role and goals..."
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Responsibilities</Label>
                <Textarea
                  placeholder="What will they be doing daily?"
                  className="min-h-[120px]"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>Key Qualifications</Label>
                    <Textarea
                      placeholder="One per line..."
                      className="min-h-[120px]"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Perks & Benefits</Label>
                    <Textarea
                      placeholder="Why join this company?"
                      className="min-h-[120px]"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900 text-white">
            <CardHeader>
               <CardTitle>Publish Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-400">Application Email</Label>
                <Input
                  type="email"
                  placeholder="hiring@company.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div className="pt-4 space-y-3">
                 <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                   {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                   Publish Now
                 </Button>
                 <Button type="button" variant="ghost" className="w-full text-slate-400 hover:text-white" onClick={() => router.back()}>
                   Cancel
                 </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-xs font-bold uppercase text-slate-400">Posting Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { label: "Clear Requirements", desc: "List specific skills to find better matches." },
                 { label: "Salary Range", desc: "Jobs with salaries get 2x more applicants." },
                 { label: "Be Descriptive", desc: "Clearly define what success looks like." }
               ].map((tip, i) => (
                  <div key={i} className="flex gap-3">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                     <div>
                        <p className="text-xs font-bold">{tip.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tip.desc}</p>
                     </div>
                  </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}