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
import { ArrowLeft, Loader2, Save, Send, ShieldCheck, Briefcase, MapPin, DollarSign, Clock, Sparkles, RefreshCw } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useAuthProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
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
      toast.error("Organization identifier missing");
      return;
    }

    if (!formData.title || !formData.company || !formData.description) {
      toast.error("Required institutional fields missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const requirementList = formData.requirements
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const benefitsList = formData.benefits
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        organizationId: profile.organizationId,
        title: formData.title,
        companyName: formData.company,
        locationCity: formData.location,
        jobType: formData.type?.replace("-", "_") || "full_time",
        description: formData.description + (formData.responsibilities ? `\n\nResponsibilities:\n${formData.responsibilities}` : ""),
        requirements: requirementList,
        benefits: benefitsList,
        expiresAt: formData.applicationDeadline || null,
        isRemote: formData.remote,
        remoteType: formData.remote ? "fully_remote" : "on_site",
        applicationEmail: formData.contactEmail || null,
        applicationMethod: formData.contactEmail ? "email" : "external_url",
        status: "active"
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to transmit career node");
      }

      toast.success("Career opportunity broadcasted");
      router.push("/dashboard/jobs");
    } catch (error: any) {
      toast.error(error.message || "Failed to transmit market data");
    } finally {
      setIsSubmitting(false);
    }
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">Deployment of market nodes requires an active institutional affiliation.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/organization/setup")}>
            Establish Affiliation
         </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Interface Header */}
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Button>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Market Portal</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Node Deployment</span>
           </div>
           <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Broadcast Career Opportunity</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* CORE SPECIFICATIONS */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-6 md:p-10">
            <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Core Specifications</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Essential market role identifiers.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Professional Title</Label>
                  <Input
                    placeholder="E.G. SYSTEMS ARCHITECT"
                    className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Institution / Entity</Label>
                  <Input
                    placeholder="ORG NAME"
                    className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Deployment Zone</Label>
                  <div className="relative">
                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                     <Input
                        placeholder="E.G. NEW YORK, GLOBAL"
                        className="h-14 pl-12 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                     />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Protocol Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="SELECT CLASSIFICATION" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="full-time" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">FULL-TIME CYCLE</SelectItem>
                      <SelectItem value="part-time" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PART-TIME LOAD</SelectItem>
                      <SelectItem value="contract" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">DIRECT CONTRACT</SelectItem>
                      <SelectItem value="internship" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">RESEARCH INTERNSHIP</SelectItem>
                      <SelectItem value="freelance" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">MODULAR FREELANCE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Asset Valuation (Salary)</Label>
                  <div className="relative">
                     <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                     <Input
                        placeholder="E.G. $120,000 - $160,000"
                        className="h-14 pl-12 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                     />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Temporal Expiry</Label>
                  <div className="relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                     <Input
                        type="date"
                        className="h-14 pl-12 rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest"
                        value={formData.applicationDeadline}
                        onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                     />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                       <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold uppercase italic tracking-tighter">Remote Deployment</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ALLOW DECENTRALIZED OPERATIONS</p>
                    </div>
                 </div>
                 <Switch
                    checked={formData.remote}
                    onCheckedChange={(checked) => setFormData({ ...formData, remote: checked })}
                    className="data-[state=checked]:bg-blue-500"
                 />
              </div>
            </CardContent>
          </Card>

          {/* ASSET DESCRIPTION */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-6 md:p-10">
            <CardHeader className="px-0 pt-0 pb-10">
               <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Asset Narrative</CardTitle>
               <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Describe the role, responsibilities, and institutional requirements.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Position Summary</Label>
                <Textarea
                  placeholder="PROVIDE CORE POSITION INTELLIGENCE..."
                  className="rounded-[2rem] border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest min-h-[140px] p-6 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Nodal Responsibilities</Label>
                <Textarea
                  placeholder="LIST PRIMARY CYCLES (ONE PER LINE)..."
                  className="rounded-[2rem] border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest min-h-[180px] p-6 resize-none"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Identity Prerequisites</Label>
                   <Textarea
                     placeholder="QUALIFICATIONS / SKILLS..."
                     className="rounded-[2rem] border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest min-h-[180px] p-6 resize-none"
                     value={formData.requirements}
                     onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                   />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Institutional Yields (Benefits)</Label>
                   <Textarea
                     placeholder="PERKS / ADVANTAGES..."
                     className="rounded-[2rem] border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest min-h-[180px] p-6 resize-none"
                     value={formData.benefits}
                     onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                   />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* DISPATCH CONTROL */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Send className="h-5 w-5" />
               </div>
               <p className="text-base font-black uppercase italic tracking-tighter">Dispatch Control</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Contact Relay Email</Label>
                <Input
                  type="email"
                  placeholder="TALENT@CORP.COM"
                  className="h-14 rounded-2xl border-none bg-white/10 shadow-sm focus:ring-2 focus:ring-blue-500/40 text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div className="pt-6 space-y-3">
                 <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs transition-all">
                   {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                   {isSubmitting ? "PROCESSING..." : "TRANSMIT NODE"}
                 </Button>
                 <Button type="button" variant="ghost" className="w-full h-14 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white" onClick={() => router.back()}>
                   ABORT DEPLOYMENT
                 </Button>
              </div>
            </div>
          </Card>

          {/* DEPLOYMENT STRATEGY */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-300 border-b border-slate-50 pb-4">Strategy Tips</h4>
            <div className="space-y-6">
               {[
                 { label: "Precision Requirements", desc: "Identify specific nodal credentials needed for success." },
                 { label: "Asset Valuation", desc: "Provide clear financial brackets to optimize interest." },
                 { label: "Decentralized Access", desc: "Clearly define remote versus localized operations." }
               ].map((tip, i) => (
                  <div key={i} className="flex gap-4 group">
                     <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shadow-glow shadow-blue-500 group-hover:scale-125 transition-transform"></div>
                     <div>
                        <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-900">{tip.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{tip.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
          </Card>
        </div>
      </form>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Career Deployment Protocol v1.4.0 • Market Nexus Hub</p>
      </footer>
    </div>
  );
}