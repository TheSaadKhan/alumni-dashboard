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
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Zap,
  Loader2,
  CheckCircle2,
  FileText,
  Save,
  Trash2,
  Plus,
  X,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { JobType, ExperienceLevel, SalaryPeriod } from "@/lib/generated/prisma";

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const jobId = params?.jobId as string;
  const organizationId = (profile as any)?.organizationId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");
  
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    companyName: "",
    locationCity: "",
    jobType: "full_time" as JobType,
    experienceLevel: "mid" as ExperienceLevel,
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryPeriod: "annual" as SalaryPeriod,
    requirements: [] as string[],
    isRemote: false,
  });

  useEffect(() => {
    if (jobId && organizationId) {
      fetchJob();
    }
  }, [jobId, organizationId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      const data = await res.json();
      const job = data.job;
      
      setFormData({
        title: job.title,
        description: job.description,
        companyName: job.companyName,
        locationCity: job.locationCity,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin?.toString() || "",
        salaryMax: job.salaryMax?.toString() || "",
        salaryCurrency: job.salaryCurrency || "USD",
        salaryPeriod: job.salaryPeriod || "annual",
        requirements: job.requirements?.split('\n') || [],
        isRemote: job.isRemote || false,
      });
    } catch (err) {
      toast.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

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
      requirements: formData.requirements.filter((_: any, i: number) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requirements: formData.requirements.join('\n'),
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        }),
      });

      if (res.ok) {
        toast.success("Job posting updated successfully");
        router.push(`/admin/jobs/${jobId}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update job");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Loading environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-xl bg-slate-50 hover:bg-slate-100 border-none transition-all" 
            onClick={() => router.push(`/admin/jobs/${jobId}`)}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Job Posting</h1>
            <p className="text-slate-500 font-medium text-sm">Update the details for this career opportunity.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            className="h-12 rounded-xl font-bold text-rose-500 hover:bg-rose-50 px-6 transition-all"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Archive
          </Button>
          <Button 
            form="edit-job-form"
            disabled={saving}
            className="h-12 rounded-xl font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <form id="edit-job-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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
                  <Label htmlFor="title" className="text-sm font-bold text-slate-700 ml-1">Position Title *</Label>
                  <Input 
                    id="title"
                    placeholder="e.g. Senior Product Designer" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-lg focus:ring-blue-500/10 transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold text-slate-700 ml-1">Job Description *</Label>
                  <Textarea 
                    id="description"
                    placeholder="Update role expectations..." 
                    className="min-h-[250px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 font-medium text-slate-600 focus:ring-blue-500/10 transition-all leading-relaxed"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Requirements</h3>
              </div>

              <div className="space-y-6">
                <div className="flex gap-3">
                  <Input 
                    placeholder="Add a requirement..." 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-medium text-base"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} size="icon" className="h-14 w-14 rounded-2xl bg-blue-600 text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.requirements.map((req: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl group transition-all hover:border-blue-200 animate-in zoom-in-95 duration-200">
                      <span className="text-sm font-bold text-slate-600">{req}</span>
                      <button type="button" onClick={() => removeRequirement(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.requirements.length === 0 && (
                    <div className="flex items-center gap-2 text-slate-400 italic text-sm py-2 ml-1">
                      <Info className="h-4 w-4" /> No requirements added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Classification</h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Employment Type</Label>
                <Select value={formData.jobType} onValueChange={(v) => setFormData({...formData, jobType: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Experience Level</Label>
                <Select value={formData.experienceLevel} onValueChange={(v) => setFormData({...formData, experienceLevel: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead / Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Location Details</h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Company name" 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-11 font-bold text-slate-700"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-blue-50/50 border border-blue-100/50 transition-all">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Remote Policy</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Work from anywhere</p>
                </div>
                <Switch 
                  checked={formData.isRemote}
                  onCheckedChange={(c) => setFormData({...formData, isRemote: c})}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Compensation Matrix</h4>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 ml-1">Min Salary</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-8 font-bold text-slate-700"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({...formData, salaryMin: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 ml-1">Max Salary</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-12 rounded-xl border-slate-100 bg-slate-50/50 pl-8 font-bold text-slate-700"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({...formData, salaryMax: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Salary Period</Label>
                <Select value={formData.salaryPeriod} onValueChange={(v) => setFormData({...formData, salaryPeriod: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
