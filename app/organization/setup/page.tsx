"use client";

import { useState, useEffect, Suspense, JSX } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createOrganizationAction } from "@/app/actions/createOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, CheckCircle2, AlertCircle, Building2, Globe, MapPin, Calendar, BookOpen, Shield, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export const dynamic = "force-dynamic";

const STEPS = ["Organization Details", "Review & Launch"];

const orgTypes = [
  { value: "college", label: "College / University" },
  { value: "high_school", label: "High School" },
  { value: "corporate", label: "Corporate Alumni Network" },
  { value: "nonprofit", label: "Non-Profit / NGO" },
  { value: "government", label: "Government / Public Sector" },
  { value: "training_institute", label: "Training Institute" },
  { value: "other", label: "Other" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 200 }, (_, i) => currentYear - i);

function SetupContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Organization Data
  const [org, setOrg] = useState({
    name: "",
    type: "college",
    establishedYear: "",
    description: "",
    website: "",
    city: "",
    state: "",
    country: "",
    logoUrl: "",
    coverImageUrl: "",
    customDomain: "",
  });

  const [slugPreview, setSlugPreview] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/"); return; }
  }, [isLoaded, user, router]);

  useEffect(() => {
    setSlugPreview(
      org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "your-org"
    );
  }, [org.name]);

  const setO = (k: keyof typeof org, v: string) => setOrg((o) => ({ ...o, [k]: v }));

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!org.name.trim()) e.orgName = "Organization name is required";
      if (!org.establishedYear) e.establishedYear = "Established year is required";
      if (!org.country.trim()) e.country = "Country is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleLaunch = async () => {
    if (!validate(step)) return;
    setSaving(true);
    try {
      const result = await createOrganizationAction({
        name: org.name,
        type: org.type,
        description: org.description || undefined,
        website: org.website || undefined,
        establishedYear: org.establishedYear ? parseInt(org.establishedYear) : undefined,
        logoUrl: org.logoUrl || undefined,
        coverImageUrl: org.coverImageUrl || undefined,
        customDomain: org.customDomain || undefined,
        address: {
          city: org.city || undefined,
          state: org.state || undefined,
          country: org.country,
        },
      });

      if (result.success) {
        toast.success(`🎉 ${org.name} is live!`, { duration: 3000 });
        // Redirect to dashboard
        router.replace(`/organization/${result.slug}/dashboard`);
      }
    } catch (err: any) {
      console.error("Setup error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  const stepContent: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Details</h2>
            <p className="text-sm text-slate-500">Global foundation for your alumni community.</p>
          </div>
        </div>

        <div>
          <Label>Organization Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input value={org.name} onChange={(e) => setO("name", e.target.value)}
              className={`pl-10 ${errors.orgName ? "border-red-400" : ""}`}
              placeholder="e.g., Harvard Alumni Association" />
          </div>
          {errors.orgName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.orgName}</p>}
          {slugPreview && <p className="text-xs text-slate-400 mt-1">URL: /organization/<strong>{slugPreview}</strong></p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Organization Type</Label>
            <Select value={org.type} onValueChange={(v) => setO("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {orgTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Established Year *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
              <Select value={org.establishedYear} onValueChange={(v) => setO("establishedYear", v)}>
                <SelectTrigger className={`pl-10 ${errors.establishedYear ? "border-red-400" : ""}`}><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errors.establishedYear && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.establishedYear}</p>}
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</Label>
          <div className="grid grid-cols-3 gap-3 mt-1">
            <Input value={org.city} onChange={(e) => setO("city", e.target.value)} placeholder="City" />
            <Input value={org.state} onChange={(e) => setO("state", e.target.value)} placeholder="State" />
            <Input value={org.country} onChange={(e) => setO("country", e.target.value)}
              placeholder="Country *" className={errors.country ? "border-red-400" : ""} />
          </div>
          {errors.country && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.country}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
            <Input value={org.website} onChange={(e) => setO("website", e.target.value)} placeholder="https://example.com" />
          </div>
          <div>
            <Label>Custom Domain</Label>
            <Input value={org.customDomain} onChange={(e) => setO("customDomain", e.target.value)} placeholder="alumni.yourdomain.com" />
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Description</Label>
          <Textarea rows={3} value={org.description} onChange={(e) => setO("description", e.target.value)}
            placeholder="Mission and vision..." className="mt-1" />
        </div>
      </div>
    ),

    2: (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Launch</h2>
            <p className="text-sm text-slate-500">Confirm details before creating your network.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
           {[
             { label: "Org Name", value: org.name },
             { label: "Type", value: orgTypes.find(t => t.value === org.type)?.label || "—" },
             { label: "Founded", value: org.establishedYear },
             { label: "Location", value: [org.city, org.country].filter(Boolean).join(", ") },
             { label: "Domain", value: org.customDomain || "Subdomain provided" },
           ].map(row => (
             <div key={row.label} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-slate-500 font-medium">{row.label}</span>
                <span className="text-slate-900 dark:text-white font-bold">{row.value}</span>
             </div>
           ))}
        </div>

        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-4 text-sm text-indigo-800 dark:text-indigo-300">
          <p className="font-bold flex items-center gap-2 mb-1"><Shield className="h-4 w-4" /> Super Admin Control</p>
          <p className="text-xs">You will be granted full administrative control over this network. You can configure portal settings and invite members immediately after launch.</p>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <header className="text-center mb-8">
           <div className="flex justify-center mb-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                 <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`} alt="Logo" width={48} height={48} unoptimized />
              </div>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Organization Setup</h1>
           <p className="text-slate-500 mt-2">Step {step} of 2 — {STEPS[step - 1]}</p>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
          {stepContent[step]}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={back} className="flex-1 rounded-xl" disabled={saving}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={next} className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleLaunch} className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl" disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <><CheckCircle2 className="h-5 w-5 mr-2" /> Launch Network</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationSetupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <SetupContent />
    </Suspense>
  );
}