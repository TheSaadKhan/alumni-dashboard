"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Loader2, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  FileText, 
  Plus, 
  X, 
  Zap,
  Globe,
  Clock,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";

export default function CreateJobPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_name: "",
    location: "",
    employment_type: "full-time",
    salary_range: "",
    requirements: [] as string[],
    status: "draft",
  });
  const [requirementInput, setRequirementInput] = useState("");

  const organizationId = (profile as any)?.organizationId;

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirementInput.trim()],
      });
      setRequirementInput("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization node not identified");
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error("Mandatory identifiers (Title/Narrative) missing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post market node");
      }

      toast.success("Job asset deployed successfully");
      router.push("/admin/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Job Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/jobs")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Market Orchestration</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Initialize Asset</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Initialize Market Node</h1>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest" onClick={() => router.push("/admin/jobs")}>Abort</Button>
           <Button onClick={handleSubmit} disabled={loading} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-3" /> : <Zap className="h-4 w-4 mr-3" />}
              Post Asset
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
        <form onSubmit={handleSubmit} className="space-y-10">
           {/* Section 1: Identity */}
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 gap-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Opportunity Institutional Alias *</Label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="SENIOR QUANTUM ARCHITECT"
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Professional Narrative (Description) *</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={6}
                      placeholder="DEFINE THE IMPACT OF THIS ROLE..."
                      className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-bold uppercase tracking-widest p-4 resize-none leading-loose" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Entity Alias (Company)</Label>
                    <Input 
                      value={formData.company_name} 
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      placeholder="GLOBAL SYSTEMS INC."
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Geographic Vertex (Location)</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="REMOTE / GLOBAL HUB"
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Employment Vector</Label>
                    <Select value={formData.employment_type} onValueChange={(v) => setFormData({...formData, employment_type: v})}>
                       <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm text-[10px] font-black uppercase tracking-widest">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="full-time" className="text-[10px] font-black uppercase tracking-widest">Full-Cycle</SelectItem>
                          <SelectItem value="part-time" className="text-[10px] font-black uppercase tracking-widest">Partial Node</SelectItem>
                          <SelectItem value="contract" className="text-[10px] font-black uppercase tracking-widest">Protocol Contract</SelectItem>
                          <SelectItem value="internship" className="text-[10px] font-black uppercase tracking-widest">Synergy Internship</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Yield Projections (Salary)</Label>
                    <Input 
                      value={formData.salary_range} 
                      onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                      placeholder="$120K - $180K"
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">State Protocol</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                       <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm text-[10px] font-black uppercase tracking-widest">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="draft" className="text-[10px] font-black uppercase tracking-widest">Draft Node</SelectItem>
                          <SelectItem value="published" className="text-[10px] font-black uppercase tracking-widest">Live Posting</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Compliance Requirements</Label>
                 <div className="flex gap-4">
                    <Input 
                      placeholder="ENTER REQUIREMENT CRITERIA..." 
                      value={requirementInput} 
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                      className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest" 
                    />
                    <Button type="button" onClick={addRequirement} className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm"><Plus className="h-5 w-5" /></Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {formData.requirements.map((req, i) => (
                       <div key={i} className="flex items-center justify-between p-4 px-6 rounded-2xl bg-slate-50/50 hover:bg-white transition-all group">
                          <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest truncate max-w-[80%]">{req}</p>
                          <X className="h-3.5 w-3.5 text-slate-200 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => removeRequirement(i)} />
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </form>
      </Card>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Market Orchestration v1.0.1 • Career Nexus</p>
      </footer>
    </div>
  );
}
