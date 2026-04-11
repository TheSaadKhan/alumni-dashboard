"use client";

import { useState, useEffect, Suspense, JSX } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowRight,
  Shield,
  Linkedin,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useAuthProfile } from "@/context/AuthContext";

// Removed dynamic export

const STEPS = ["Your Identity", "Review & Launch"];

function AdminCompleteProfileContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    currentTitle: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  const { profile, loading, organization } = useAuthProfile();

  useEffect(() => {
    if (!isLoaded || loading) return;
    if (!user) { router.replace("/"); return; }

    // Guard: If admin profile is already complete
    if (profile?.onboardingCompleted) {
       if (profile.organizationId) {
          router.replace("/admin");
       } else {
          router.replace("/organization/setup");
       }
       return;
    }

    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    }));
  }, [isLoaded, loading, user, profile, router]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validate(step)) return;
    setSaving(true);
    try {
      const result = await updateProfileAction({
        firstName: form.firstName,
        lastName: form.lastName,
        headline: form.headline || null,
        bio: form.bio || null,
        currentTitle: form.currentTitle || null,
        linkedinUrl: form.linkedinUrl || null,
        websiteUrl: form.websiteUrl || null,
        // Defaulting location fields for now or adding them to form if needed
        city: null,
        countryCode: null
      });
      
      if (result.success) {
        toast.success("Profile saved! Proceeding to organization setup.");
        await new Promise((r) => setTimeout(r, 800));
        router.replace("/organization/setup");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const stepContent: Record<number, JSX.Element> = {
    1: (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shadow-inner">
            <User className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Identity</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Establish your presence as the network lead.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700 dark:text-slate-300">First Name *</Label>
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="First Name"
              className={`h-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500 ${errors.firstName ? "border-red-400" : ""}`}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3" /> {errors.firstName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-slate-700 dark:text-slate-300">Last Name *</Label>
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Last Name"
              className={`h-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500 ${errors.lastName ? "border-red-400" : ""}`}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3" /> {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-700 dark:text-slate-300">Professional Title</Label>
          <Input
            value={form.currentTitle}
            onChange={(e) => set("currentTitle", e.target.value)}
            placeholder="e.g., Director of Alumni Success"
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-700 dark:text-slate-300">Professional Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="e.g., Empowering graduates since 2010"
            className="h-12 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-700 dark:text-slate-300">Short Bio</Label>
          <Textarea
            rows={4}
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Vision for the community..."
            className="rounded-xl border-slate-200 dark:border-slate-800 resize-none p-4"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn
            </Label>
            <Input
              value={form.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              placeholder="URL"
              className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-500" /> Website
            </Label>
            <Input
              value={form.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="URL"
              className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shadow-inner">
            <Shield className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Confirm</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Verify your information before finalizing.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 px-6">
           {[
             { label: "Admin Name", value: `${form.firstName} ${form.lastName}` },
             { label: "Title", value: form.currentTitle || "Not specified" },
             { label: "Headline", value: form.headline || "Not specified" },
             { label: "Bio", value: form.bio ? (form.bio.substring(0, 40) + "...") : "Not specified" },
             { label: "LinkedIn", value: form.linkedinUrl || "Not specified" },
           ].map(row => (
             <div key={row.label} className="py-4 flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{row.label}</span>
                <span className="text-slate-900 dark:text-white font-semibold">{row.value}</span>
             </div>
           ))}
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
           <strong>Next Step:</strong> You will be redirected to the Organization Setup Portal where you can configure your institution's profile and global settings.
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)]">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Complete Profile</h1>
            <p className="text-slate-400 font-medium text-sm mt-1">Administrator Onboarding Flow</p>
        </div>

        {/* Custom Progress Bar */}
        <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
                <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                        className={`h-full bg-indigo-600 transition-all duration-700 ease-in-out ${step >= i + 1 ? "w-full" : "w-0"}`}
                    ></div>
                </div>
            ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <User className="h-40 w-40" />
          </div>
          
          <AnimatePresence mode="wait">
             <div key={step}>
                {stepContent[step]}
             </div>
          </AnimatePresence>

          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <Button variant="ghost" onClick={back} className="flex-1 h-12 rounded-2xl font-bold text-slate-500">
                Back
              </Button>
            )}
            {step < STEPS.length ? (
              <Button onClick={next} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20" disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <><CheckCircle2 className="h-5 w-5 mr-2" /> Finalize Identity</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompleteProfile() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <AdminCompleteProfileContent />
    </Suspense>
  );
}
